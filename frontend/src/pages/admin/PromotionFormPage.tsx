import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useAdminProducts, useAdminPromotion, useCatalogOptions, useSavePromotion,
} from '@/features/admin/hooks/useAdminQueries';
import { PageHeader } from '@/features/admin/components/PageHeader';
import type { AdminPromotion, CatalogOptions } from '@/features/admin/types';
import { getApiError } from '@/shared/api/httpClient';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/EmptyState';
import { Field, Input, Select, Textarea, Toggle } from '@/shared/ui/Field';
import { Icon } from '@/shared/ui/Icon';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Spinner } from '@/shared/ui/Spinner';
import { toast } from '@/shared/ui/toast';

/** ISO (UTC) → valor de <input type="datetime-local"> en la hora local del navegador. */
function toLocalInput(iso?: string, fallback?: Date): string {
  const date = iso ? new Date(iso) : fallback;
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const baseSchema = z.object({
  name: z.string().trim().min(2, 'Nombre requerido').max(120),
  description: z.string().max(255).optional(),
  type: z.enum(['percentage', 'fixed']),
  value: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Valor inválido').refine((v) => Number(v) > 0, 'Debe ser mayor a 0'),
  starts_at: z.string().min(1, 'Fecha requerida'),
  ends_at: z.string().min(1, 'Fecha requerida'),
  is_active: z.boolean(),
});
const schema = baseSchema
  .refine((v) => v.type !== 'percentage' || Number(v.value) <= 100, { path: ['value'], message: 'El porcentaje no puede superar 100' })
  .refine((v) => new Date(v.ends_at) > new Date(v.starts_at), { path: ['ends_at'], message: 'Debe ser posterior al inicio' });
type FormValues = z.infer<typeof schema>;

export default function PromotionFormPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const promotion = useAdminPromotion(id);
  const options = useCatalogOptions();

  if ((id && promotion.isLoading) || options.isLoading) return <FormSkeleton />;
  if ((id && (promotion.isError || !promotion.data)) || options.isError || !options.data) {
    return <ErrorState onRetry={() => { promotion.refetch(); options.refetch(); }} />;
  }
  return <PromotionForm key={promotion.data?.id ?? 'new'} promotion={promotion.data} options={options.data} />;
}

function PromotionForm({ promotion, options }: { promotion?: AdminPromotion; options: CatalogOptions }) {
  const navigate = useNavigate();
  const save = useSavePromotion(promotion?.id);
  const [categoryIds, setCategoryIds] = useState<number[]>(promotion?.category_ids ?? []);
  const [products, setProducts] = useState<{ id: number; name: string }[]>(promotion?.products ?? []);
  const [targetError, setTargetError] = useState<string>();
  const [banner, setBanner] = useState<File | null>(null);
  const [removeBanner, setRemoveBanner] = useState(false);
  const bannerPreview = useMemo(() => (banner ? URL.createObjectURL(banner) : null), [banner]);
  useEffect(() => () => { if (bannerPreview) URL.revokeObjectURL(bannerPreview); }, [bannerPreview]);

  const now = new Date();
  const { register, handleSubmit, control, watch, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: promotion?.name ?? '',
      description: promotion?.description ?? '',
      type: promotion?.type ?? 'percentage',
      value: promotion ? String(Number(promotion.value)) : '',
      starts_at: toLocalInput(promotion?.starts_at, now),
      ends_at: toLocalInput(promotion?.ends_at, new Date(now.getTime() + 7 * 86_400_000)),
      is_active: promotion?.is_active ?? true,
    },
  });
  const type = watch('type');

  const onSubmit = (values: FormValues) => {
    if (categoryIds.length === 0 && products.length === 0) {
      setTargetError('Selecciona al menos un producto o una categoría.');
      return;
    }
    setTargetError(undefined);

    const form = new FormData();
    form.append('name', values.name);
    form.append('description', values.description ?? '');
    form.append('type', values.type);
    form.append('value', values.value);
    form.append('starts_at', new Date(values.starts_at).toISOString());
    form.append('ends_at', new Date(values.ends_at).toISOString());
    form.append('is_active', values.is_active ? '1' : '0');
    categoryIds.forEach((cid) => form.append('category_ids[]', String(cid)));
    products.forEach((p) => form.append('product_ids[]', String(p.id)));
    if (banner) form.append('banner', banner);
    if (removeBanner && !banner) form.append('remove_banner', '1');

    save.mutate(form, {
      onSuccess: (saved) => {
        setBanner(null);
        setRemoveBanner(false);
        if (!promotion) navigate(`/admin/promociones/${saved.id}`, { replace: true });
      },
      onError: (error) => {
        const { message, errors: apiErrors = {} } = getApiError(error);
        let mapped = false;
        for (const [field, msgs] of Object.entries(apiErrors)) {
          if (field in baseSchema.shape) {
            setError(field as keyof FormValues, { message: msgs[0] });
            mapped = true;
          } else if (field.startsWith('product_ids') || field.startsWith('category_ids')) {
            setTargetError(msgs[0]);
            mapped = true;
          } else if (field === 'banner') {
            toast.error(msgs[0]);
            mapped = true;
          }
        }
        toast.error(mapped ? 'Revisa los campos marcados.' : message);
      },
    });
  };

  const currentBanner = bannerPreview ?? (removeBanner ? null : promotion?.banner ?? null);
  const parentName = (parentId: number | null) => options.categories.find((c) => c.id === parentId)?.name;

  return (
    <>
      <Link to="/admin/promociones" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <Icon name="chevronLeft" className="h-4 w-4" /> Promociones
      </Link>
      <PageHeader title={promotion ? promotion.name : 'Nueva promoción'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <section className="card grid gap-5 p-6 md:grid-cols-2">
          <Field label="Nombre" htmlFor="name" error={errors.name?.message} className="md:col-span-2">
            <Input id="name" placeholder="Ej: Rebajas de verano" invalid={!!errors.name} {...register('name')} />
          </Field>
          <Field label="Descripción (se muestra en el banner)" htmlFor="description" error={errors.description?.message} className="md:col-span-2">
            <Textarea id="description" rows={2} maxLength={255} {...register('description')} />
          </Field>
          <Field label="Tipo de descuento" htmlFor="type">
            <Select id="type" {...register('type')}>
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed">Monto fijo</option>
            </Select>
          </Field>
          <Field label={type === 'percentage' ? 'Porcentaje' : 'Monto a descontar'} htmlFor="value" error={errors.value?.message}>
            <Input id="value" inputMode="decimal" placeholder={type === 'percentage' ? '20' : '15.00'} invalid={!!errors.value} {...register('value')} />
          </Field>
          <Field label="Inicio" htmlFor="starts_at" error={errors.starts_at?.message}>
            <Input id="starts_at" type="datetime-local" invalid={!!errors.starts_at} {...register('starts_at')} />
          </Field>
          <Field label="Fin" htmlFor="ends_at" error={errors.ends_at?.message}>
            <Input id="ends_at" type="datetime-local" invalid={!!errors.ends_at} {...register('ends_at')} />
          </Field>
          <div className="md:col-span-2">
            <Controller control={control} name="is_active" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Activa" />} />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-sans text-base font-semibold">¿A qué aplica?</h2>
          <p className="mb-4 mt-1 text-sm text-ink-muted">Una categoría incluye sus subcategorías. Puedes combinar categorías y productos sueltos.</p>
          {targetError && <p className="field-error mb-3" role="alert">{targetError}</p>}

          <fieldset>
            <legend className="field-label">Categorías</legend>
            <div className="flex flex-wrap gap-2">
              {options.categories.map((c) => {
                const checked = categoryIds.includes(c.id);
                return (
                  <label key={c.id} className={cn('cursor-pointer rounded-full border px-3 py-1.5 text-sm transition', checked ? 'border-ink bg-ink text-cream' : 'border-cream-300 bg-white hover:border-ink/40')}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => setCategoryIds((ids) => (checked ? ids.filter((x) => x !== c.id) : [...ids, c.id]))}
                    />
                    {c.parent_id ? `${parentName(c.parent_id)} › ` : ''}{c.name}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6">
            <span className="field-label">Productos</span>
            <ProductPicker selected={products} onChange={setProducts} />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-sans text-base font-semibold">Banner de portada (opcional)</h2>
          <p className="mb-4 mt-1 text-sm text-ink-muted">Se muestra en la portada mientras la promoción esté vigente. Ideal 1600×600 px.</p>
          {currentBanner && (
            <div className="relative mb-4 overflow-hidden rounded-xl">
              <img src={currentBanner} alt="Banner de la promoción" className="aspect-[8/3] w-full object-cover" />
              <button
                type="button"
                onClick={() => { setBanner(null); setRemoveBanner(true); }}
                className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                aria-label="Quitar banner"
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm hover:border-ink/40">
            <Icon name="image" className="h-4 w-4" />
            {currentBanner ? 'Cambiar imagen' : 'Subir imagen'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                if (file.size > 8 * 1024 * 1024) return toast.error('La imagen supera los 8 MB.');
                setBanner(file);
                setRemoveBanner(false);
              }}
            />
          </label>
        </section>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button type="submit" size="lg" loading={save.isPending} className="shadow-lg">
            {promotion ? 'Guardar cambios' : 'Crear promoción'}
          </Button>
        </div>
      </form>
    </>
  );
}

/** Buscador de productos con debounce: una sola petición por pausa al escribir. */
function ProductPicker({ selected, onChange }: { selected: { id: number; name: string }[]; onChange: (v: { id: number; name: string }[]) => void }) {
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 300);
  const { data, isFetching } = useAdminProducts({ q, per_page: 8 }, q.length >= 2);
  const selectedIds = new Set(selected.map((p) => p.id));
  const results = q.length >= 2 ? data?.data.filter((p) => !selectedIds.has(p.id)) ?? [] : [];

  return (
    <div>
      {selected.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {selected.map((p) => (
            <li key={p.id} className="inline-flex items-center gap-1 rounded-full bg-clay-light py-1 pl-3 pr-1 text-sm text-clay-dark">
              {p.name}
              <button type="button" onClick={() => onChange(selected.filter((x) => x.id !== p.id))} className="rounded-full p-1 hover:bg-white/60" aria-label={`Quitar ${p.name}`}>
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-lg border border-cream-300 bg-white px-3">
          <Icon name="search" className="h-4 w-4 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto por nombre o SKU…"
            className="h-10 w-full bg-transparent text-sm outline-none"
            aria-label="Buscar productos para la promoción"
          />
          {isFetching && <Spinner className="h-4 w-4 text-ink-muted" />}
        </div>
        {results.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-lg border border-cream-300 bg-white py-1 shadow-lg">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { onChange([...selected, { id: p.id, name: p.name }]); setSearch(''); }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-cream-100"
                >
                  {p.thumb ? <img src={p.thumb} alt="" width={28} height={36} className="h-9 w-7 rounded object-cover" /> : <span className="h-9 w-7 rounded bg-cream-200" />}
                  <span className="flex-1">{p.name}</span>
                  <span className="text-xs text-ink-muted">{p.category?.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando promoción">
      <Skeleton className="h-9 w-64" />
      <div className="card grid gap-5 p-6 md:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
