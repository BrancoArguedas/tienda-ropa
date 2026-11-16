import { Link } from 'react-router-dom';
import { useDashboard } from '@/features/admin/hooks/useAdminQueries';
import { OrderStatusBadge } from '@/features/admin/components/OrderStatusBadge';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { useMoney } from '@/features/store/useStoreSettings';
import { formatDateTime, formatShortDate } from '@/shared/lib/format';
import { ErrorState } from '@/shared/ui/EmptyState';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { Dashboard } from '@/features/admin/types';

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const money = useMoney();

  return (
    <>
      <PageHeader title="Resumen" description="Cómo va tu tienda este mes." />
      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Pedidos por validar" value={String(data.orders_by_status.pending)} accent link="/admin/pedidos?status=pending" />
            <Kpi label="Ventas del mes" value={String(data.month.orders)} />
            <Kpi label="Ingresos del mes" value={money(data.month.revenue)} />
            <Kpi label="No concretados" value={String(data.orders_by_status.cancelled)} />
          </div>

          <section className="card p-5">
            <h2 className="mb-4 font-sans text-sm font-semibold">Ventas confirmadas · últimos 30 días</h2>
            <SalesChart rows={data.sales_last_30_days} format={money} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="mb-4 font-sans text-sm font-semibold">Pedidos recientes</h2>
              {data.recent_orders.length === 0 ? (
                <p className="text-sm text-ink-muted">Aún no hay pedidos.</p>
              ) : (
                <ul className="divide-y divide-cream-200">
                  {data.recent_orders.map((o) => (
                    <li key={o.id}>
                      <Link to={`/admin/pedidos/${o.id}`} className="flex items-center gap-3 py-3 text-sm hover:bg-cream-100">
                        <span className="font-mono text-xs">{o.code}</span>
                        <span className="flex-1 truncate">{o.customer_name}</span>
                        <OrderStatusBadge status={o.status} />
                        <span className="w-24 text-right font-medium">{money(o.total)}</span>
                      </Link>
                      <p className="-mt-2 pb-2 text-xs text-ink-muted">{formatDateTime(o.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card p-5">
              <h2 className="mb-4 font-sans text-sm font-semibold">Más vendidos del mes</h2>
              {data.top_products.length === 0 ? (
                <p className="text-sm text-ink-muted">Sin ventas confirmadas este mes.</p>
              ) : (
                <ol className="space-y-3">
                  {data.top_products.map((p, i) => (
                    <li key={p.product_name} className="flex items-center gap-3 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cream-200 text-xs font-semibold">{i + 1}</span>
                      <span className="flex-1">{p.product_name}</span>
                      <span className="text-ink-muted">{p.units} u.</span>
                      <span className="w-24 text-right font-medium">{money(p.revenue)}</span>
                    </li>
                  ))}
                </ol>
              )}

              <h2 className="mb-3 mt-8 font-sans text-sm font-semibold">Stock bajo (≤ 3)</h2>
              {data.low_stock.length === 0 ? (
                <p className="text-sm text-ink-muted">Todo con buen stock.</p>
              ) : (
                <ul className="space-y-2">
                  {data.low_stock.map((v) => (
                    <li key={v.id} className="flex items-center gap-2 text-sm">
                      <Link to={`/admin/productos/${v.product_id}`} className="flex-1 hover:underline">
                        {v.product_name} <span className="text-ink-muted">· {v.color_name} / {v.size_name}</span>
                      </Link>
                      <span className={v.stock === 0 ? 'font-semibold text-red-700' : 'font-semibold text-amber-700'}>{v.stock}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}

function Kpi({ label, value, accent, link }: { label: string; value: string; accent?: boolean; link?: string }) {
  const body = (
    <div className={`card h-full p-5 ${accent ? 'border-clay/40 bg-clay-light' : ''}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-3xl tabular-nums">{value}</p>
    </div>
  );
  return link ? <Link to={link}>{body}</Link> : body;
}

function SalesChart({ rows, format }: { rows: Dashboard['sales_last_30_days']; format: (v: number | string) => string }) {
  if (rows.length === 0) return <p className="text-sm text-ink-muted">Sin ventas confirmadas en los últimos 30 días.</p>;
  const max = Math.max(...rows.map((r) => Number(r.revenue)), 1);
  return (
    <div className="flex h-40 items-end gap-1 overflow-x-auto" role="img" aria-label="Gráfico de ventas por día">
      {rows.map((r) => (
        <div key={r.day} className="group flex min-w-[18px] flex-1 flex-col items-center justify-end gap-1">
          <div className="relative w-full rounded-t bg-ink/80 transition group-hover:bg-clay" style={{ height: `${Math.max((Number(r.revenue) / max) * 100, 4)}%` }}>
            <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] text-cream group-hover:block">
              {format(r.revenue)} · {r.orders} ped.
            </span>
          </div>
          <span className="text-[10px] text-ink-muted">{formatShortDate(`${r.day}T12:00:00`)}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando resumen">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-56 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
