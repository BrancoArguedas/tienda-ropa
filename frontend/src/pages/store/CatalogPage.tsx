import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCatalogFilters, useInfiniteProducts } from '@/features/catalog/hooks/useCatalogQueries';
import { SORT_OPTIONS, useCatalogParams } from '@/features/catalog/hooks/useCatalogParams';
import { FiltersPanel } from '@/features/catalog/components/FiltersPanel';
import { ProductGrid, ProductGridSkeleton } from '@/features/catalog/components/ProductGrid';
import type { CategoryNode } from '@/shared/api/types';
import { Button } from '@/shared/ui/Button';
import { Drawer } from '@/shared/ui/Drawer';
import { EmptyState, ErrorState } from '@/shared/ui/EmptyState';
import { Icon } from '@/shared/ui/Icon';
import { Skeleton } from '@/shared/ui/Skeleton';

function findCategory(nodes: CategoryNode[], slug: string): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const child = findCategory(node.children, slug);
    if (child) return child;
  }
  return undefined;
}

export function CatalogPage({ onSale = false }: { onSale?: boolean }) {
  const { slug } = useParams();
  const fixed = useMemo(() => ({ category: slug, on_sale: onSale || undefined }), [slug, onSale]);
  const { params, update, clear, activeCount } = useCatalogParams(fixed);
  const filtersQuery = useCatalogFilters();
  const products = useInfiniteProducts(params);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = slug && filtersQuery.data ? findCategory(filtersQuery.data.categories, slug) : undefined;
  const title = onSale ? 'Ofertas' : params.q ? `Resultados para “${params.q}”` : category?.name ?? (slug ? '' : 'Todo el catálogo');
  const items = products.data?.pages.flatMap((p) => p.data) ?? [];
  const total = products.data?.pages[0]?.meta.total;

  const panel = (
    <FiltersPanel
      filters={filtersQuery.data}
      loading={filtersQuery.isLoading}
      params={params}
      onChange={update}
      onClear={clear}
      activeCount={activeCount}
    />
  );

  return (
    <div className="container-page py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {title ? <h1 className="text-4xl">{title}</h1> : <Skeleton className="h-10 w-48" />}
          <p className="mt-1 h-5 text-sm text-ink-muted">{total !== undefined && `${total} producto${total === 1 ? '' : 's'}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
            <Icon name="filter" className="h-4 w-4" /> Filtros {activeCount > 0 && `(${activeCount})`}
          </Button>
          <label className="sr-only" htmlFor="sort">Ordenar</label>
          <select id="sort" value={params.sort} onChange={(e) => update({ sort: e.target.value })} className="field-input h-9 w-auto rounded-full py-0 pr-8">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{panel}</aside>
        <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros" side="left" footer={<Button fullWidth onClick={() => setFiltersOpen(false)}>Ver {total ?? ''} productos</Button>}>
          <div className="p-5">{panel}</div>
        </Drawer>

        <section aria-live="polite" aria-busy={products.isFetching}>
          {products.isLoading ? (
            <ProductGridSkeleton />
          ) : products.isError ? (
            <ErrorState onRetry={() => products.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              title="No encontramos productos"
              description="Prueba quitando algunos filtros o buscando otra palabra."
              action={activeCount > 0 && <Button variant="secondary" onClick={clear}>Limpiar filtros</Button>}
            />
          ) : (
            <div className={products.isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <ProductGrid products={items} />
              {products.isFetchingNextPage && (
                <div className="mt-8">
                  <ProductGridSkeleton count={4} />
                </div>
              )}
              {products.hasNextPage && !products.isFetchingNextPage && (
                <div className="mt-10 flex justify-center">
                  <Button variant="secondary" onClick={() => products.fetchNextPage()}>
                    Cargar más
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
