import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer } from '@/shared/ui/Drawer';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Icon } from '@/shared/ui/Icon';
import { getApiError } from '@/shared/api/httpClient';
import type { PlacedOrder } from '@/shared/api/types';
import { useMoney } from '@/features/store/useStoreSettings';
import { cartSelectors, useCartStore, useCartUi } from '../cartStore';
import { usePlaceOrder } from '../usePlaceOrder';
import { CartLine } from './CartLine';
import { CheckoutForm, type CheckoutValues } from './CheckoutForm';

type Step = 'cart' | 'checkout' | 'done';

export function CartDrawer() {
  const open = useCartUi((s) => s.open);
  const setOpen = useCartUi((s) => s.setOpen);
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore(cartSelectors.subtotal);
  const total = useCartStore(cartSelectors.total);
  const money = useMoney();
  const placeOrder = usePlaceOrder();

  const [step, setStep] = useState<Step>('cart');
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<number, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>();
  const [generalError, setGeneralError] = useState<string>();

  const close = useCallback(() => {
    setOpen(false);
    if (step === 'done') {
      setStep('cart');
      setPlaced(null);
    }
  }, [setOpen, step]);

  const submit = (values: CheckoutValues) => {
    setGeneralError(undefined);
    setFormErrors(undefined);
    placeOrder.mutate(
      { ...values, items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })) },
      {
        onSuccess: (order) => {
          setPlaced(order);
          setStep('done');
          clear();
          setLineErrors({});
          // Intento automático; si el navegador bloquea la ventana, queda el botón visible.
          window.open(order.whatsapp_url, '_blank', 'noopener');
        },
        onError: (error) => {
          const { message, errors = {} } = getApiError(error);
          const perLine: Record<number, string> = {};
          for (const [key, messages] of Object.entries(errors)) {
            const match = key.match(/^items\.(\d+)/);
            if (match) perLine[Number(match[1])] = messages[0];
          }
          setLineErrors(perLine);
          setFormErrors(errors);
          setGeneralError(message);
          if (Object.keys(perLine).length > 0) setStep('cart');
        },
      },
    );
  };

  const title = step === 'checkout' ? 'Tus datos' : step === 'done' ? '¡Pedido registrado!' : 'Tu carrito';

  return (
    <Drawer
      open={open}
      onClose={close}
      title={title}
      footer={
        step === 'cart' && items.length > 0 ? (
          <div className="space-y-3">
            {subtotal > total && (
              <div className="flex justify-between text-sm text-ink-muted">
                <span>Ahorras</span>
                <span>-{money(subtotal - total)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-sm">Total estimado</span>
              <span className="text-xl font-semibold">{money(total)}</span>
            </div>
            {generalError && step === 'cart' && <p className="text-xs text-red-700">{generalError}</p>}
            <Button variant="whatsapp" size="lg" fullWidth onClick={() => setStep('checkout')}>
              <Icon name="whatsapp" className="h-5 w-5" />
              Comprar por WhatsApp
            </Button>
            <p className="text-center text-xs text-ink-muted">El precio final se confirma al registrar tu pedido.</p>
          </div>
        ) : undefined
      }
    >
      {step === 'done' && placed ? (
        <div className="space-y-5 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-light text-sage">
            <Icon name="check" className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-ink-muted">Código de pedido</p>
            <p className="font-display text-3xl">{placed.code}</p>
            <p className="mt-1 text-sm">Total: <strong>{money(placed.total)}</strong></p>
          </div>
          <p className="text-sm text-ink-soft">Envía el mensaje en WhatsApp para coordinar el pago y la entrega. Si no se abrió automáticamente, usa el botón:</p>
          <a href={placed.whatsapp_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1F8F4E] font-medium text-white hover:bg-[#187540]">
            <Icon name="whatsapp" className="h-5 w-5" /> Abrir WhatsApp
          </a>
          <Button variant="ghost" onClick={close}>Seguir comprando</Button>
        </div>
      ) : step === 'checkout' ? (
        <>
          {generalError && Object.keys(lineErrors).length === 0 && (
            <p className="mx-5 mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{generalError}</p>
          )}
          <CheckoutForm submitting={placeOrder.isPending} serverErrors={formErrors} onSubmit={submit} onBack={() => setStep('cart')} />
        </>
      ) : items.length === 0 ? (
        <EmptyState
          icon="bag"
          title="Tu carrito está vacío"
          description="Explora el catálogo y agrega tus prendas favoritas."
          action={
            <Link to="/catalogo" onClick={close} className="text-sm font-medium underline underline-offset-4">
              Ver catálogo
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-cream-300 px-5">
          {items.map((item) => (
            <CartLine
              key={item.variantId}
              item={item}
              error={lineErrors[item.variantId]}
              onQuantity={(q) => setQuantity(item.variantId, q)}
              onRemove={() => remove(item.variantId)}
              onNavigate={close}
            />
          ))}
        </ul>
      )}
    </Drawer>
  );
}
