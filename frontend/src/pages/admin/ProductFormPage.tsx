import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminProduct, useCatalogOptions, useSaveProduct } from '@/features/admin/hooks/useAdminQueries';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { VariantMatrix, cellKey, emptyCell, type MatrixState } from '@/features/admin/products/VariantMatrix';
import { ImageManager } from '@/features/admin/products/ImageManager';
import type { AdminProduct, ProductPayload } from '@/features/admin/types';
import { getApiError } from '@/shared/api/httpClient';
import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/EmptyState';
import { Field, Input, Select, Textarea, Toggle } from '@/shared/ui/Field';
import { Icon } from '@/shared/ui/Icon';
import { Skeleton } from '@/shared/ui/Skeleton';
import { toast } from '@/shared/ui/toast';

const schema = z.object({
  name: z.string().trim().min(2, 'Nombre requerido').max(150),
  category_id: z.coerce.number({ invalid_type_error: 'Elige una categoría' }).positive('Elige una categoría'),
  base_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Precio inválido (ej: 89.90)'),
  description: z.string().max(5000).optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function matrixFrom(product?: AdminProduct): MatrixState {
  if (!product) return { sizeIds: [], colorIds: [], cells: {} };
  const cells: MatrixState['cells'] = {};
  for (const v of product.variants) {
    cells[cellKey(v.size_id, v.color_id)] = { stock: String(v.stock), price_override: v.price_override ?? '', sku: v.sku ?? '' };
  }
  return {
    sizeIds: [...new Set(product.variants.map((v) => v.size_id))],
    colorIds: [...new Set(product.variants.map((v) => v.color_id))],
    cells,
  };
}

export default function ProductFormPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const product = useAdminProduct(id);
  const options = useCatalogOptions();

  if ((id && product.isLoading) || options.isLoading) return <FormSkeleton />;
  if ((id && (product.isError || !product.data)) || options.isError || !options.data) {
    return <ErrorState onRetry={() => { product.refetch(); options.refetch(); }} />;
  }

  return <ProductForm key={product.data?.id ?? 'new'} product={product.data} options={options.data} />;
}

function ProductForm({ product, options }: { product?: AdminProduct; options: NonNullable<ReturnType<typeof useCatalogOptions>['data']> }) {
  const navigate = useNavigate();
  const save = useSaveProduct(product?.id);
  const [matrix, setMatrix] = useState<MatrixState>(() => matrixFrom(product));
  const [matrixError, setMatrixError] = useState<string>();

  const { register, handleSubmit, control, setError, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      category_id: product?.category_id ?? 0,
      base_price: product?.base_price ?? '',
      description: product?.description ?? '',
      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
    },
  });

  // Aviso al salir con cambios sin guardar.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const onSubmit = (values: FormValues) => {
    setMatrixError(undefined);
    const variants: ProductPayload['variants'] = [];
    for (const sizeId of matrix.sizeIds) {
      for (const colorId of matrix.colorIds) {
        const cell = matrix.cells[cellKey(sizeId, colorId)] ?? emptyCell();
        const stock = Number(cell.stock);
        if (!Number.isInteger(stock) || stock < 0) {
          setMatrixError('El stock debe ser un número entero mayor o igual a 0.');
          return;
        }
        variants.push({ size_id: sizeId, color_id: colorId, stock, price_override: cell.price_override || null, sku: cell.sku || null });
      }
    }

    save.mutate(
      { ...values, description: values.description || null, variants },
      {
        onSuccess: (saved) => {
          reset(values);
          if (!product) navigate(`/admin/productos/${saved.id}`, { replace: true });
        },
        onError: (error) => {
          const { message, errors: apiErrors = {} } = getApiError(error);
          let mapped = false;
          for (const [field, msgs] of Object.entries(apiErrors)) {
            if (field in schema.shape) {
              setError(field as keyof FormValues, { message: msgs[0] });
              mapped = true;
            } else if (field.startsWith('variants')) {
              setMatrixError(msgs[0]);
              mapped = true;
            }
          }
          toast.error(mapped ? 'Revisa los campos marcados.' : message);
        },
      },
    );
  };

  const parentName = (parentId: number | null) => options.categories.find((c) => c.id === parentId)?.name;

  return (
    <>
      <Link to="/admin/productos" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <Icon name="chevronLeft" className="h-4 w-4" /> Productos
      </Link>
      <PageHeader
        title={product ? product.name : 'Nuevo producto'}
        actions={product && (
          <a href={`/producto/${product.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline underline-offset-4">
            Ver en tienda <Icon name="external" className="h-4 w-4" />
          </a>
        )}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <section className="card grid gap-5 p-6 md:grid-cols-2">
          <Field label="Nombre" htmlFor="name" error={errors.name?.message} className="md:col-span-2">
            <Input id="name" invalid={!!errors.name} {...register('name')} />
          </Field>
          <Field label="Categoría" htmlFor="category_id" error={errors.category_id?.message}>
            <Select id="category_id" invalid={!!errors.category_id} {...register('category_id')}>
              <option value={0}>Selecciona…</option>
              {options.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent_id ? `${parentName(c.parent_id)} › ${c.name}` : c.name}{c.is_active ? '' : ' (inactiva)'}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Precio base" htmlFor="base_price" error={errors.base_price?.message} hint="Las promociones se aplican sobre este precio.">
            <Input id="base_price" inputMode="decimal" placeholder="89.90" invalid={!!errors.base_price} {...register('base_price')} />
          </Field>
          <Field label="Descripción" htmlFor="description" error={errors.description?.message} className="md:col-span-2">
            <Textarea id="description" rows={5} placeholder="Material, corte, cuidados…" {...register('description')} />
          </Field>
          <div className="flex flex-wrap gap-6 md:col-span-2">
            <Controller control={control} name="is_active" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Visible en la tienda" />} />
            <Controller control={control} name="is_featured" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Destacado en portada" />} />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-sans text-base font-semibold">Tallas, colores y stock</h2>
          <VariantMatrix options={options} value={matrix} onChange={setMatrix} error={matrixError} />
        </section>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button type="submit" size="lg" loading={save.isPending} className="shadow-lg">
            {product ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>

      <section className="card mt-6 p-6">
        <h2 className="mb-4 font-sans text-base font-semibold">Fotos</h2>
        {product ? (
          <ImageManager product={product} colors={options.colors} />
        ) : (
          <p className="text-sm text-ink-muted">Guarda el producto para poder subir sus fotos.</p>
        )}
      </section>
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando producto">
      <Skeleton className="h-9 w-64" />
      <div className="card grid gap-5 p-6 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
        <Skeleton className="h-28 md:col-span-2" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
