import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdminSettings, useSaveSettings } from '@/features/admin/hooks/useAdminQueries';
import { PageHeader } from '@/features/admin/components/PageHeader';
import type { AdminSettings } from '@/features/admin/types';
import { getApiError } from '@/shared/api/httpClient';
import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/EmptyState';
import { Field, Input, Textarea } from '@/shared/ui/Field';
import { Skeleton } from '@/shared/ui/Skeleton';
import { toast } from '@/shared/ui/toast';

const optionalUrl = z.string().trim().max(255).refine((v) => v === '' || /^https?:\/\/\S+$/.test(v), 'URL inválida (https://…)');

const optionalEmail = z.string().trim().max(150).refine((v) => v === '' || z.string().email().safeParse(v).success, 'Correo inválido');

const schema = z.object({
  store_name: z.string().trim().min(1, 'Requerido').max(80),
  store_tagline: z.string().max(150),
  whatsapp_number: z.string().trim().regex(/^\+?\d{8,15}$/, 'Formato internacional sin espacios, ej: 51987654321'),
  currency_code: z.string().trim().regex(/^[A-Za-z]{3}$/, 'Código de 3 letras, ej: PEN').transform((v) => v.toUpperCase()),
  locale: z.string().trim().regex(/^[a-z]{2}-[A-Z]{2}$/, 'Ej: es-PE'),
  instagram_url: optionalUrl,
  facebook_url: optionalUrl,
  tiktok_url: optionalUrl,
  address: z.string().max(255),
  size_guide: z.string().max(3000),
  legal_name: z.string().trim().max(150),
  ruc: z.string().trim().refine((v) => v === '' || /^(10|15|17|20)\d{9}$/.test(v), '11 dígitos, empieza con 10, 15, 17 o 20'),
  legal_address: z.string().trim().max(255),
  privacy_email: optionalEmail,
  claims_email: optionalEmail,
  data_retention_months: z.string().trim().refine((v) => v === '' || (/^\d+$/.test(v) && +v >= 6 && +v <= 120), 'Entre 6 y 120 meses'),
});

export default function SettingsPage() {
  const { data, isLoading, isError, refetch } = useAdminSettings();

  return (
    <>
      <PageHeader title="Ajustes" description="Datos de la tienda, número de WhatsApp que recibe los pedidos, datos legales y guía de tallas." />
      {isLoading ? (
        <div className="card grid gap-5 p-6 md:grid-cols-2" role="status" aria-label="Cargando ajustes">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <SettingsForm settings={data} />
      )}
    </>
  );
}

function SettingsForm({ settings }: { settings: AdminSettings }) {
  const save = useSaveSettings();
  const defaults = Object.fromEntries(Object.keys(schema.shape).map((k) => [k, settings[k as keyof AdminSettings] ?? ''])) as AdminSettings;
  const { register, handleSubmit, setError, reset, formState: { errors, isDirty } } = useForm<AdminSettings>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const onSubmit = (values: AdminSettings) =>
    save.mutate(values, {
      onSuccess: (saved) => reset(saved),
      onError: (error) => {
        const { message, errors: apiErrors = {} } = getApiError(error);
        Object.entries(apiErrors).forEach(([field, msgs]) => setError(field as keyof AdminSettings, { message: msgs[0] }));
        toast.error(Object.keys(apiErrors).length ? 'Revisa los campos marcados.' : message);
      },
    });

  const field = (name: keyof AdminSettings, label: string, props: Record<string, unknown> = {}, hint?: string) => (
    <Field label={label} htmlFor={name} error={errors[name]?.message} hint={hint}>
      <Input id={name} invalid={!!errors[name]} {...props} {...register(name)} />
    </Field>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <section className="card grid gap-5 p-6 md:grid-cols-2">
        <h2 className="font-sans text-base font-semibold md:col-span-2">Tienda</h2>
        {field('store_name', 'Nombre de la tienda')}
        {field('store_tagline', 'Frase / eslogan')}
        {field('whatsapp_number', 'Número de WhatsApp', { inputMode: 'tel', placeholder: '51987654321' }, 'Con código de país, sin “+” ni espacios. Aquí llegan los pedidos.')}
        {field('address', 'Dirección / zona de entrega')}
        {field('currency_code', 'Moneda', { maxLength: 3, placeholder: 'PEN' })}
        {field('locale', 'Formato regional', { placeholder: 'es-PE' }, 'Define separadores de miles y decimales.')}
      </section>

      <section className="card grid gap-5 p-6 md:grid-cols-3">
        <h2 className="font-sans text-base font-semibold md:col-span-3">Redes sociales</h2>
        {field('instagram_url', 'Instagram', { type: 'url', placeholder: 'https://instagram.com/…' })}
        {field('facebook_url', 'Facebook', { type: 'url', placeholder: 'https://facebook.com/…' })}
        {field('tiktok_url', 'TikTok', { type: 'url', placeholder: 'https://tiktok.com/@…' })}
      </section>

      <section className="card grid gap-5 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="font-sans text-base font-semibold">Datos legales</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Aparecen en el pie de página, la Política de privacidad, los Términos y el Libro de Reclamaciones (Ley 29733 y Código del Consumidor).
          </p>
        </div>
        {field('legal_name', 'Razón social o nombre del titular', { placeholder: 'Diana Store E.I.R.L.' })}
        {field('ruc', 'RUC', { inputMode: 'numeric', maxLength: 11 })}
        {field('legal_address', 'Domicilio legal / fiscal')}
        {field('data_retention_months', 'Conservación de datos de pedidos (meses)', { inputMode: 'numeric' }, 'Pasado este plazo, los datos del cliente se anonimizan automáticamente.')}
        {field('privacy_email', 'Correo para derechos ARCO (público)', { type: 'email' }, 'Donde los clientes piden acceso, rectificación o eliminación de sus datos.')}
        {field('claims_email', 'Correo que recibe los reclamos (interno)', { type: 'email' }, 'Recibe una copia de cada hoja del Libro de Reclamaciones. No se publica.')}
      </section>

      <section className="card p-6">
        <Field label="Guía de tallas" htmlFor="size_guide" error={errors.size_guide?.message} hint="Se muestra en la ficha de producto. Puedes usar varias líneas.">
          <Textarea id="size_guide" rows={8} className="font-mono text-xs" {...register('size_guide')} />
        </Field>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" size="lg" loading={save.isPending} disabled={!isDirty} className="shadow-lg">
          Guardar ajustes
        </Button>
      </div>
    </form>
  );
}
