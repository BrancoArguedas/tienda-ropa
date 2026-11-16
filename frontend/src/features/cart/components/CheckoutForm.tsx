import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Field, Input, Textarea } from '@/shared/ui/Field';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

export const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, 'Ingresa tu nombre').max(120),
  customer_phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-()]{7,20}$/, 'Ingresa un número de teléfono válido'),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
  // Ley 29733: consentimiento expreso, nunca premarcado.
  privacy_accepted: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar la Política de privacidad y los Términos' }) }),
  // Honeypot: oculto para personas; los bots suelen llenarlo.
  website: z.string().optional(),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  submitting: boolean;
  serverErrors?: Record<string, string[]>;
  onSubmit: (values: CheckoutValues) => void;
  onBack: () => void;
}

/** Formulario corto previo a WhatsApp: identifica al cliente en el registro del pedido. */
export function CheckoutForm({ submitting, serverErrors, onSubmit, onBack }: CheckoutFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { customer_name: '', customer_phone: '', notes: '', website: '' },
  });

  const fieldError = (name: keyof CheckoutValues) => errors[name]?.message ?? serverErrors?.[name]?.[0];
  const consentError = fieldError('privacy_accepted');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5" noValidate>
      <p className="text-sm text-ink-soft">
        Déjanos tus datos para registrar tu pedido. Luego se abrirá WhatsApp con el resumen para coordinar el pago y la entrega.
      </p>
      <Field label="Nombre completo" htmlFor="customer_name" error={fieldError('customer_name')}>
        <Input id="customer_name" autoComplete="name" invalid={!!fieldError('customer_name')} {...register('customer_name')} />
      </Field>
      <Field label="Teléfono / WhatsApp" htmlFor="customer_phone" error={fieldError('customer_phone')}>
        <Input id="customer_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="987 654 321" invalid={!!fieldError('customer_phone')} {...register('customer_phone')} />
      </Field>
      <Field label="Nota (opcional)" htmlFor="notes" error={fieldError('notes')}>
        <Textarea id="notes" rows={3} placeholder="Ej: entrega en Miraflores por la tarde" {...register('notes')} />
      </Field>

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">No completar este campo</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
            aria-invalid={!!consentError || undefined}
            aria-describedby={consentError ? 'privacy-error' : undefined}
            {...register('privacy_accepted')}
          />
          <span>
            He leído la{' '}
            <Link to="/privacidad" target="_blank" className="font-medium text-ink underline underline-offset-2">
              Política de privacidad
            </Link>{' '}
            y acepto los{' '}
            <Link to="/terminos" target="_blank" className="font-medium text-ink underline underline-offset-2">
              Términos y condiciones
            </Link>
            .
          </span>
        </label>
        {consentError && (
          <p id="privacy-error" className="field-error" role="alert">
            {consentError}
          </p>
        )}
        <p className="mt-2 text-xs text-ink-muted">Usamos tus datos solo para gestionar este pedido y su entrega.</p>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" variant="whatsapp" size="lg" fullWidth loading={submitting}>
          <Icon name="whatsapp" className="h-5 w-5" />
          Enviar pedido por WhatsApp
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          Volver al carrito
        </Button>
      </div>
    </form>
  );
}
