import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '@/features/admin/adminApi';
import { useAdminOrder, useAnonymizeOrder, useOrderTransition } from '@/features/admin/hooks/useAdminQueries';
import { toast } from '@/shared/ui/toast';
import { OrderStatusBadge } from '@/features/admin/components/OrderStatusBadge';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useMoney } from '@/features/store/useStoreSettings';
import { getApiError } from '@/shared/api/httpClient';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/EmptyState';
import { Icon } from '@/shared/ui/Icon';
import { Skeleton } from '@/shared/ui/Skeleton';

type Action = 'confirm' | 'cancel';

export default function OrderDetailPage() {
  const id = Number(useParams().id);
  const { data: order, isLoading, isError, refetch } = useAdminOrder(id);
  const transition = useOrderTransition(id);
  const [action, setAction] = useState<Action | null>(null);
  const [anonymizeOpen, setAnonymizeOpen] = useState(false);
  const anonymize = useAnonymizeOrder(id);
  const money = useMoney();

  if (isLoading) return <OrderDetailSkeleton />;
  if (isError || !order) return <ErrorState onRetry={() => refetch()} />;

  const transitionError = transition.error ? getApiError(transition.error) : null;
  const customerWa = order.customer_phone ? `https://wa.me/${order.customer_phone.replace(/\D/g, '')}` : null;

  const exportData = async () => {
    if (!order.customer_phone) return;
    try {
      const json = await adminApi.exportCustomerData(order.customer_phone);
      const url = URL.createObjectURL(new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `datos-cliente-${order.code}.json` });
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiError(error).message);
    }
  };

  return (
    <>
      <Link to="/admin/pedidos" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <Icon name="chevronLeft" className="h-4 w-4" /> Pedidos
      </Link>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold">{order.code}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">Recibido el {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.status === 'pending' && (
            <>
              <Button variant="secondary" onClick={() => setAction('cancel')}>No se concretó</Button>
              <Button onClick={() => setAction('confirm')}><Icon name="check" className="h-4 w-4" /> Confirmar venta</Button>
            </>
          )}
          {order.status === 'confirmed' && (
            <Button variant="secondary" onClick={() => setAction('cancel')}>Anular venta (repone stock)</Button>
          )}
        </div>
      </header>

      {transitionError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <p className="font-semibold">{transitionError.message}</p>
          {transitionError.errors && (
            <ul className="mt-2 list-inside list-disc">
              {Object.values(transitionError.errors).flat().map((m) => <li key={m}>{m}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-cream-300 bg-cream-100 text-left text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Prenda</th>
                <th className="px-4 py-3 text-center font-medium">Cant.</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs text-ink-muted">{item.color_name} · Talla {item.size_name} · {item.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    {money(Number(item.unit_price) - Number(item.unit_discount))}
                    {Number(item.unit_discount) > 0 && <p className="text-xs text-ink-muted line-through">{money(item.unit_price)}</p>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{money(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="space-y-1 border-t border-cream-300 bg-cream-100 px-4 py-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
            {Number(order.discount_total) > 0 && (
              <div className="flex justify-between text-clay"><dt>Descuentos</dt><dd>-{money(order.discount_total)}</dd></div>
            )}
            <div className="flex justify-between pt-1 text-base font-semibold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
          </dl>
        </section>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-sans text-sm font-semibold">Cliente</h2>
            <p>{order.customer_name}</p>
            {order.customer_phone && <p className="text-sm text-ink-muted">{order.customer_phone}</p>}
            {order.notes && <p className="mt-3 rounded-lg bg-cream-100 p-3 text-sm">“{order.notes}”</p>}
            {customerWa && (
              <a href={customerWa} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#1F8F4E] hover:underline">
                <Icon name="whatsapp" className="h-4 w-4" /> Escribir al cliente
              </a>
            )}
            {order.anonymized_at && (
              <p className="mt-3 text-xs text-ink-muted">Datos personales anonimizados el {formatDateTime(order.anonymized_at)}.</p>
            )}
          </section>

          {!order.anonymized_at && (
            <section className="card p-5 text-sm">
              <h2 className="mb-1 font-sans text-sm font-semibold">Privacidad del cliente (ARCO)</h2>
              <p className="text-xs text-ink-muted">
                {order.privacy_accepted_at
                  ? `Aceptó la política de privacidad el ${formatDateTime(order.privacy_accepted_at)}.`
                  : 'Pedido anterior al registro de consentimiento.'}
              </p>
              <div className="mt-3 flex flex-col items-start gap-2">
                <button type="button" onClick={exportData} className="text-sm font-medium text-ink underline-offset-2 hover:underline">
                  Exportar datos del cliente (acceso)
                </button>
                {order.status !== 'pending' && (
                  <button type="button" onClick={() => setAnonymizeOpen(true)} className="text-sm font-medium text-red-700 underline-offset-2 hover:underline">
                    Anonimizar datos del cliente (cancelación)
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-3 font-sans text-sm font-semibold">Historial</h2>
            <ol className="relative space-y-4 border-l border-cream-300 pl-4">
              {order.histories?.map((h) => (
                <li key={h.id} className="text-sm">
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-ink" />
                  <p className="font-medium">{h.to_label}</p>
                  <p className="text-xs text-ink-muted">{h.created_at && formatDateTime(h.created_at)}{h.user && ` · ${h.user}`}</p>
                  {h.comment && <p className="mt-1 text-ink-soft">{h.comment}</p>}
                </li>
              ))}
            </ol>
          </section>

          {order.whatsapp_message && (
            <details className="card p-5 text-sm">
              <summary className="cursor-pointer font-semibold">Mensaje enviado por WhatsApp</summary>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-xs text-ink-soft">{order.whatsapp_message}</pre>
            </details>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={action === 'confirm'}
        title="Confirmar venta"
        message="Se descontará el stock de cada prenda. Hazlo cuando el pago o la entrega estén asegurados."
        confirmLabel="Confirmar venta"
        withComment
        loading={transition.isPending}
        onClose={() => setAction(null)}
        onConfirm={(comment) => transition.mutate({ action: 'confirm', comment }, { onSettled: () => setAction(null) })}
      />
      <ConfirmDialog
        open={action === 'cancel'}
        title={order.status === 'confirmed' ? 'Anular venta' : 'Marcar como no concretada'}
        message={order.status === 'confirmed' ? 'La venta se anulará y el stock se repondrá. Esta acción es definitiva.' : 'El pedido quedará como no concretado. Esta acción es definitiva.'}
        confirmLabel="Sí, continuar"
        tone="danger"
        withComment
        loading={transition.isPending}
        onClose={() => setAction(null)}
        onConfirm={(comment) => transition.mutate({ action: 'cancel', comment }, { onSettled: () => setAction(null) })}
      />
      <ConfirmDialog
        open={anonymizeOpen}
        title="Anonimizar datos del cliente"
        message="Se borrarán el nombre, el teléfono, la nota y el mensaje de WhatsApp de este pedido. Los importes se conservan. Esta acción es definitiva."
        confirmLabel="Sí, anonimizar"
        tone="danger"
        loading={anonymize.isPending}
        onClose={() => setAnonymizeOpen(false)}
        onConfirm={() => anonymize.mutate(undefined, { onSettled: () => setAnonymizeOpen(false) })}
      />
    </>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando pedido">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-80 rounded-2xl" />
        <div className="space-y-6">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
