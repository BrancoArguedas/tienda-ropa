import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminPromotions, useDeletePromotion } from '@/features/admin/hooks/useAdminQueries';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import type { AdminPromotion } from '@/features/admin/types';
import { useMoney } from '@/features/store/useStoreSettings';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { EmptyState, ErrorState } from '@/shared/ui/EmptyState';
import { Icon } from '@/shared/ui/Icon';
import { Pagination } from '@/shared/ui/Pagination';
import { TableSkeleton } from '@/shared/ui/Skeleton';

function promotionState(p: AdminPromotion): { label: string; tone: 'sage' | 'amber' | 'neutral' | 'red' } {
  if (!p.is_active) return { label: 'Desactivada', tone: 'neutral' };
  if (p.is_current) return { label: 'Vigente', tone: 'sage' };
  return new Date(p.starts_at) > new Date() ? { label: 'Programada', tone: 'amber' } : { label: 'Vencida', tone: 'red' };
}

export default function PromotionsPage() {
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<AdminPromotion | null>(null);
  const { data, isLoading, isError, isPlaceholderData, refetch } = useAdminPromotions(page);
  const remove = useDeletePromotion();
  const money = useMoney();

  return (
    <>
      <PageHeader
        title="Promociones"
        description="Descuentos con fechas de vigencia por producto o categoría. Si varias aplican, se usa la de mayor descuento."
        actions={
          <Link to="/admin/promociones/nueva" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-cream hover:bg-ink-soft">
            <Icon name="plus" className="h-4 w-4" /> Nueva promoción
          </Link>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.data.length === 0 ? (
        <div className="card">
          <EmptyState icon="tag" title="Sin promociones" description="Crea una promoción para mostrar precios tachados y banners en la portada." />
        </div>
      ) : (
        <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-cream-300 text-left text-xs uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Promoción</th>
                  <th className="px-4 py-3 font-medium">Descuento</th>
                  <th className="px-4 py-3 font-medium">Vigencia</th>
                  <th className="px-4 py-3 font-medium">Aplica a</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {data.data.map((p) => {
                  const state = promotionState(p);
                  return (
                    <tr key={p.id} className="hover:bg-cream-100">
                      <td className="px-4 py-3">
                        <Link to={`/admin/promociones/${p.id}`} className="flex items-center gap-3">
                          {p.banner ? (
                            <img src={p.banner} alt="" width={64} height={32} loading="lazy" className="h-8 w-16 rounded object-cover" />
                          ) : (
                            <span className="flex h-8 w-16 items-center justify-center rounded bg-cream-200 text-ink-muted"><Icon name="tag" className="h-4 w-4" /></span>
                          )}
                          <span className="font-medium hover:underline">{p.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-semibold text-clay">
                        {p.type === 'percentage' ? `-${Number(p.value)}%` : `-${money(p.value)}`}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        <p>{formatDateTime(p.starts_at)}</p>
                        <p className="text-xs text-ink-muted">hasta {formatDateTime(p.ends_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {[
                          p.products_count ? `${p.products_count} producto${p.products_count === 1 ? '' : 's'}` : null,
                          p.categories_count ? `${p.categories_count} categoría${p.categories_count === 1 ? '' : 's'}` : null,
                        ].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3"><Badge tone={state.tone}>{state.label}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => setToDelete(p)} className="rounded-full p-2 text-ink-muted hover:bg-red-50 hover:text-red-700" aria-label={`Eliminar ${p.name}`}>
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} total={data.meta.total} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar promoción"
        message={`“${toDelete?.name}” dejará de aplicarse de inmediato. Los pedidos ya registrados conservan su descuento.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}
      />
    </>
  );
}
