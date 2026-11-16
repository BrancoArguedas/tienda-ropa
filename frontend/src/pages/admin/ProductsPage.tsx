import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminProducts, useCatalogOptions, useDeleteProduct } from '@/features/admin/hooks/useAdminQueries';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import type { AdminProductListItem } from '@/features/admin/types';
import { useMoney } from '@/features/store/useStoreSettings';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { EmptyState, ErrorState } from '@/shared/ui/EmptyState';
import { Icon } from '@/shared/ui/Icon';
import { Pagination } from '@/shared/ui/Pagination';
import { TableSkeleton } from '@/shared/ui/Skeleton';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<AdminProductListItem | null>(null);
  const q = useDebounce(search.trim(), 350);
  const money = useMoney();
  const { data: options } = useCatalogOptions();
  const deleteProduct = useDeleteProduct();

  const { data, isLoading, isError, isPlaceholderData, refetch } = useAdminProducts({
    q: q || undefined,
    category_id: categoryId ? Number(categoryId) : undefined,
    status: status || undefined,
    page,
  });

  return (
    <>
      <PageHeader
        title="Productos"
        description="Prendas, precios, tallas, colores, stock y fotos."
        actions={
          <Link to="/admin/productos/nuevo" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-cream hover:bg-ink-soft">
            <Icon name="plus" className="h-4 w-4" /> Nuevo producto
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_160px]">
        <div className="flex items-center gap-2 rounded-lg border border-cream-300 bg-white px-3">
          <Icon name="search" className="h-4 w-4 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre o SKU…"
            className="h-10 w-full bg-transparent text-sm outline-none"
            aria-label="Buscar productos"
          />
        </div>
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="field-input" aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {options?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }} className="field-input" aria-label="Estado">
          <option value="">Todos</option>
          <option value="active">Visibles</option>
          <option value="inactive">Ocultos</option>
        </select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.data.length === 0 ? (
        <div className="card"><EmptyState icon="box" title="Sin productos" description="Crea tu primer producto para empezar a vender." /></div>
      ) : (
        <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-cream-300 text-left text-xs uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {data.data.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-100">
                    <td className="px-4 py-3">
                      <Link to={`/admin/productos/${p.id}`} className="flex items-center gap-3">
                        {p.thumb ? (
                          <img src={p.thumb} alt="" width={40} height={52} className="h-[52px] w-10 rounded object-cover" loading="lazy" />
                        ) : (
                          <span className="flex h-[52px] w-10 items-center justify-center rounded bg-cream-200 text-ink-muted"><Icon name="image" className="h-4 w-4" /></span>
                        )}
                        <span className="font-medium hover:underline">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{p.category?.name}</td>
                    <td className="px-4 py-3 text-right">{money(p.base_price)}</td>
                    <td className={cn('px-4 py-3 text-right font-medium', p.stock_total === 0 && 'text-red-700')}>
                      {p.stock_total}
                      <p className="text-xs font-normal text-ink-muted">{p.variants_count} variantes</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={p.is_active ? 'sage' : 'neutral'}>{p.is_active ? 'Visible' : 'Oculto'}</Badge>
                        {p.is_featured && <Badge tone="dark">Destacado</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/productos/${p.id}`} className="inline-flex rounded-full p-2 text-ink-muted hover:bg-cream-200 hover:text-ink" aria-label={`Editar ${p.name}`}>
                        <Icon name="pencil" className="h-4 w-4" />
                      </Link>
                      <button type="button" onClick={() => setToDelete(p)} className="rounded-full p-2 text-ink-muted hover:bg-red-50 hover:text-red-700" aria-label={`Eliminar ${p.name}`}>
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} total={data.meta.total} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar producto"
        message={`“${toDelete?.name}” dejará de verse en la tienda. Los pedidos anteriores se conservan.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={deleteProduct.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteProduct.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}
      />
    </>
  );
}
