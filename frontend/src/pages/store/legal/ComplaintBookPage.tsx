import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { storeApi, type ComplaintPayload } from '@/features/store/storeApi';
import type { ComplaintReceipt } from '@/shared/api/types';
import { Button } from '@/shared/ui/Button';
import { Field, Input, Select, Textarea } from '@/shared/ui/Field';
import { LegalLayout, OwnerLine } from './LegalLayout';

const DOC_PATTERNS: Record<string, RegExp> = {
  DNI: /^\d{8}$/,
  RUC: /^(10|15|17|20)\d{9}$/,
  CE: /^[A-Za-z0-9]{6,12}$/,
  PAS: /^[A-Za-z0-9]{5,15}$/,
};

export const complaintSchema = z
  .object({
    consumer_name: z.string().trim().min(3, 'Ingresa tu nombre completo').max(150),
    document_type: z.enum(['DNI', 'CE', 'PAS', 'RUC']),
    document_number: z.string().trim().min(1, 'Ingresa tu número de documento'),
    address: z.string().trim().min(5, 'Ingresa tu domicilio').max(255),
    phone: z.string().trim().regex(/^\+?[\d\s\-()]{7,20}$/, 'Ingresa un teléfono válido'),
    email: z.string().trim().email('Ingresa un correo válido').max(150),
    is_minor: z.boolean(),
    guardian_name: z.string().trim().max(150).optional(),
    item_type: z.enum(['product', 'service']),
    amount: z
      .string()
      .trim()
      .regex(/^(\d{1,8}([.,]\d{1,2})?)?$/, 'Monto no válido')
      .optional(),
    item_description: z.string().trim().min(3, 'Describe el producto o servicio').max(500),
    order_code: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]*$/, 'Código no válido')
      .max(20)
      .optional(),
    type: z.enum(['claim', 'complaint']),
    detail: z.string().trim().min(10, 'Cuéntanos qué ocurrió (mínimo 10 caracteres)').max(3000),
    consumer_request: z.string().trim().min(5, 'Indica qué solicitas').max(2000),
    accepted: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar para registrar la hoja' }) }),
    website: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (!DOC_PATTERNS[v.document_type].test(v.document_number)) {
      ctx.addIssue({ code: 'custom', path: ['document_number'], message: 'Número no válido para el tipo de documento' });
    }
    if (v.is_minor && !v.guardian_name) {
      ctx.addIssue({ code: 'custom', path: ['guardian_name'], message: 'Indica el nombre del padre, madre o apoderado' });
    }
  });

type ComplaintValues = z.infer<typeof complaintSchema>;

const toPayload = (v: ComplaintValues): ComplaintPayload => ({
  ...v,
  guardian_name: v.is_minor ? v.guardian_name : undefined,
  amount: v.amount ? Number(v.amount.replace(',', '.')) : undefined,
  order_code: v.order_code || undefined,
});

export default function ComplaintBookPage() {
  const [receipt, setReceipt] = useState<ComplaintReceipt | null>(null);

  return (
    <LegalLayout title="Libro de Reclamaciones">
      {(settings, owner) =>
        receipt ? (
          <ComplaintReceiptView receipt={receipt} />
        ) : (
          <>
            <p>
              Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, esta institución cuenta con un Libro de Reclamaciones
              a tu disposición.
            </p>
            <div className="not-prose my-6 rounded-xl border border-cream-300 bg-white p-4 text-sm">
              <p className="font-semibold">Proveedor</p>
              <p className="mt-1 text-ink-soft">
                <OwnerLine owner={owner} />
                {settings.legal.legal_name && settings.legal.legal_name !== settings.store_name && <> · Nombre comercial: {settings.store_name}</>}
              </p>
              <p className="mt-1 text-ink-soft">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
            </div>
            <ComplaintForm onDone={setReceipt} />
          </>
        )
      }
    </LegalLayout>
  );
}

function ComplaintForm({ onDone }: { onDone: (r: ComplaintReceipt) => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<ComplaintValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { document_type: 'DNI', is_minor: false, item_type: 'product', type: 'claim', website: '' },
  });
  const [generalError, setGeneralError] = useState<string>();

  const mutation = useMutation({
    mutationFn: (v: ComplaintValues) => storeApi.fileComplaint(toPayload(v)),
    onSuccess: (r) => {
      onDone(r);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const serverErrors = (error.response.data?.errors ?? {}) as Record<string, string[]>;
        Object.entries(serverErrors).forEach(([field, messages]) => setError(field as keyof ComplaintValues, { message: messages[0] }));
        setGeneralError('Revisa los campos marcados.');
      } else if (isAxiosError(error) && error.response?.status === 429) {
        setGeneralError('Has enviado varias hojas seguidas. Inténtalo nuevamente en unos minutos.');
      } else {
        setGeneralError('No pudimos registrar tu hoja. Inténtalo de nuevo o escríbenos por WhatsApp.');
      }
    },
  });

  const isMinor = watch('is_minor');
  const err = (name: keyof ComplaintValues) => errors[name]?.message;

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="not-prose space-y-8">
      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-xl">1. Identificación del consumidor reclamante</legend>
        <Field label="Nombre completo" htmlFor="consumer_name" error={err('consumer_name')}>
          <Input id="consumer_name" autoComplete="name" invalid={!!err('consumer_name')} {...register('consumer_name')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <Field label="Documento" htmlFor="document_type">
            <Select id="document_type" {...register('document_type')}>
              <option value="DNI">DNI</option>
              <option value="CE">Carné de extranjería</option>
              <option value="PAS">Pasaporte</option>
              <option value="RUC">RUC</option>
            </Select>
          </Field>
          <Field label="Número de documento" htmlFor="document_number" error={err('document_number')}>
            <Input id="document_number" invalid={!!err('document_number')} {...register('document_number')} />
          </Field>
        </div>
        <Field label="Domicilio" htmlFor="address" error={err('address')}>
          <Input id="address" autoComplete="street-address" invalid={!!err('address')} {...register('address')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono" htmlFor="phone" error={err('phone')}>
            <Input id="phone" type="tel" autoComplete="tel" invalid={!!err('phone')} {...register('phone')} />
          </Field>
          <Field label="Correo electrónico" htmlFor="email" error={err('email')} hint="Aquí te enviaremos la constancia y la respuesta.">
            <Input id="email" type="email" autoComplete="email" invalid={!!err('email')} {...register('email')} />
          </Field>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-ink" {...register('is_minor')} />
          Soy menor de edad
        </label>
        {isMinor && (
          <Field label="Nombre del padre, madre o apoderado" htmlFor="guardian_name" error={err('guardian_name')}>
            <Input id="guardian_name" invalid={!!err('guardian_name')} {...register('guardian_name')} />
          </Field>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-xl">2. Identificación del bien contratado</legend>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" value="product" className="accent-ink" {...register('item_type')} /> Producto
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="service" className="accent-ink" {...register('item_type')} /> Servicio
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monto reclamado S/ (opcional)" htmlFor="amount" error={err('amount')}>
            <Input id="amount" inputMode="decimal" invalid={!!err('amount')} {...register('amount')} />
          </Field>
          <Field label="Código de pedido (opcional)" htmlFor="order_code" error={err('order_code')} hint="Ej: PD-AB12CD">
            <Input id="order_code" invalid={!!err('order_code')} {...register('order_code')} />
          </Field>
        </div>
        <Field label="Descripción del producto o servicio" htmlFor="item_description" error={err('item_description')}>
          <Input id="item_description" invalid={!!err('item_description')} {...register('item_description')} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-xl">3. Detalle de la reclamación y pedido del consumidor</legend>
        <div className="space-y-2 text-sm">
          <label className="flex items-start gap-2">
            <input type="radio" value="claim" className="mt-1 accent-ink" {...register('type')} />
            <span>
              <strong>Reclamo:</strong> disconformidad relacionada a los productos o servicios.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" value="complaint" className="mt-1 accent-ink" {...register('type')} />
            <span>
              <strong>Queja:</strong> disconformidad no relacionada a los productos o servicios, o malestar respecto a la atención al público.
            </span>
          </label>
        </div>
        <Field label="Detalle" htmlFor="detail" error={err('detail')}>
          <Textarea id="detail" rows={5} invalid={!!err('detail')} {...register('detail')} />
        </Field>
        <Field label="Pedido (¿qué solicitas?)" htmlFor="consumer_request" error={err('consumer_request')}>
          <Textarea id="consumer_request" rows={3} invalid={!!err('consumer_request')} {...register('consumer_request')} />
        </Field>
      </fieldset>

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="cb-website">No completar este campo</label>
        <input id="cb-website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div className="space-y-3 rounded-xl bg-cream-200/60 p-4 text-xs text-ink-soft">
        <p>
          La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una
          denuncia ante el INDECOPI.
        </p>
        <p>El proveedor deberá dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles improrrogables.</p>
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-ink-soft">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-ink" aria-invalid={!!err('accepted') || undefined} {...register('accepted')} />
          <span>
            Declaro que los datos son verdaderos y autorizo su tratamiento para atender esta hoja, según la{' '}
            <Link to="/privacidad" target="_blank" className="font-medium text-ink underline underline-offset-2">
              Política de privacidad
            </Link>
            .
          </span>
        </label>
        {err('accepted') && <p className="field-error" role="alert">{err('accepted')}</p>}
      </div>

      {generalError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {generalError}
        </p>
      )}

      <Button type="submit" size="lg" loading={mutation.isPending}>
        Enviar hoja de reclamación
      </Button>
    </form>
  );
}

function ComplaintReceiptView({ receipt }: { receipt: ComplaintReceipt }) {
  const due = new Date(`${receipt.due_at}T12:00:00`).toLocaleDateString('es-PE');

  return (
    <div className="not-prose space-y-4">
      <div className="rounded-xl border border-sage/40 bg-sage/10 p-5">
        <p className="text-sm text-ink-soft">Tu hoja fue registrada con el número</p>
        <p className="mt-1 font-display text-3xl">{receipt.number}</p>
        <p className="mt-3 text-sm text-ink-soft">
          Fecha: {new Date(receipt.created_at).toLocaleString('es-PE')}. Enviamos una copia a <strong>{receipt.email}</strong> y te responderemos
          a más tardar el <strong>{due}</strong>.
        </p>
      </div>
      <p className="text-sm text-ink-muted">Guarda este número. Si no ves el correo, revisa tu carpeta de spam.</p>
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button onClick={() => window.print()}>Imprimir o guardar PDF</Button>
        <Link to="/" className="inline-flex items-center rounded-full border border-ink/15 px-5 py-2.5 text-sm">
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
