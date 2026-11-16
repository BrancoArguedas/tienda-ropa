import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdminOrders } from '@/features/admin/hooks/useAdminQueries';
import { OrderStatusBadge } from '@/features/admin/components/OrderStatusBadge';
import { PageHeader } from '@/features/admin/components/PageHeader';
import type { OrderStatus } from '@/features/admin/types';
import { useMoney } from '@/features/store/useStoreSettings';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatDateTime } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { EmptyState, ErrorState } from '@/shared/ui/EmptyState';
import { Icon } from '@/shared/ui/Icon';
import { Pagination } from '@/shared/ui/Pagination';
import { TableSkeleton } from '@/shared/ui/Skeleton';

const TABS: { value: OrderStatus | ''; label: string }[] = [
  { value: 'pending', label: 'Por validar' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'cancelled', label: 'No concretadas' },
  { value: '', label: 'Todos' },
];

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get('status') ?? 'pending';
  const status = (rawStatus === 'all' ? '' : rawStatus) as OrderStatus | '';
  const page = Number(searchParams.get('page') ?? 1);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const q = useDebounce(search.trim(), 350);
  const money = useMoney();

  const { data, isLoading, isError, isPlaceholderData, refetch } = useAdminOrders({
    status: status || undefined,
    q: q || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
  });

  const setParam = (key: string, value: string) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      value ? next.set(key, value) : next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });

  return (
    <>
      <PageHeader title="Pedidos" description="Pedidos enviados por WhatsApp. Valida si la venta se concretó." />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-full bg-white p-1 scrollbar-none" role="tablist">
        {TABS.map((tab) => {
          const count = tab.value ? data?.counts[tab.value] : undefined;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => setParam('status', tab.value || 'all')}
              className={cn('flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition', status === tab.value ? 'bg-ink text-cream' : 'hover:bg-ink/5')}
            >
              {tab.label}
              {count !== undefined && <span className="rounded-full bg-cream-200 px-2 text-xs text-ink">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-2 rounded-lg border border-cream-300 bg-white px-3">
          <Icon name="search" className="h-4 w-4 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setParam('page', '');
            }}
            placeholder="Código, nombre o teléfono completo…"
            className="h-10 w-full bg-transparent text-sm outline-none"
            aria-label="Buscar pedidos"
          />
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="field-input" aria-label="Desde" />
        <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} className="field-input" aria-label="Hasta" />
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.data.length === 0 ? (
        <div className="card"><EmptyState icon="receipt" title="No hay pedidos" description="Cuando un cliente envíe su carrito por WhatsApp aparecerá aquí." /></div>
      ) : (
        <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-cream-300 text-left text-xs uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {data.data.map((order) => (
                  <tr key={order.id} className="hover:bg-cream-100">
                    <td className="px-4 py-3">
                      <Link to={`/admin/pedidos/${order.id}`} className="font-mono text-xs font-semibold hover:underline">{order.code}</Link>
                      <p className="text-xs text-ink-muted">{order.items_count} prenda{order.items_count === 1 ? '' : 's'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{order.customer_name}</p>
                      <p className="text-xs text-ink-muted">{order.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-right font-semibold">{money(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} total={data.meta.total} onChange={(p) => setParam('page', String(p))} />
        </div>
      )}
    </>
  );
}
