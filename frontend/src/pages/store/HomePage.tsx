import { Link } from 'react-router-dom';
import { useCatalogFilters, useHome } from '@/features/catalog/hooks/useCatalogQueries';
import { ProductGrid, ProductGridSkeleton } from '@/features/catalog/components/ProductGrid';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { ErrorState } from '@/shared/ui/EmptyState';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Icon } from '@/shared/ui/Icon';

export function HomePage() {
  const { data, isLoading, isError, refetch } = useHome();
  const { data: settings } = useStoreSettings();
  const { data: filters } = useCatalogFilters();
  const banner = data?.promotions[0];

  return (
    <>
      <section className="container-page pt-6">
        {isLoading ? (
          <Skeleton className="h-[340px] w-full rounded-3xl md:h-[440px]" />
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-ink text-cream">
            {banner?.banner && (
              <img src={banner.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" width={1600} height={600} />
            )}
            <div className="relative flex min-h-[340px] flex-col justify-end gap-4 p-8 md:min-h-[440px] md:p-14">
              <p className="text-xs font-semibold uppercase tracking-[.25em] text-cream/80">
                {banner ? 'Promoción vigente' : 'Nueva colección'}
              </p>
              <h1 className="max-w-2xl text-4xl leading-[1.05] md:text-6xl">
                {banner?.name ?? settings?.store_tagline ?? 'Moda que te acompaña'}
              </h1>
              {banner?.description && <p className="max-w-lg text-cream/85">{banner.description}</p>}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to={banner ? '/ofertas' : '/catalogo'} className="inline-flex h-12 items-center gap-2 rounded-full bg-cream px-6 text-sm font-semibold text-ink hover:bg-white">
                  {banner ? 'Ver ofertas' : 'Ver colección'} <Icon name="chevronRight" className="h-4 w-4" />
                </Link>
                <Link to="/catalogo" className="inline-flex h-12 items-center rounded-full border border-cream/40 px-6 text-sm font-semibold hover:bg-cream/10">
                  Todo el catálogo
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {filters && filters.categories.length > 0 && (
        <section className="container-page mt-10">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {filters.categories.flatMap((c) => [c, ...c.children]).map((c) => (
              <Link key={c.id} to={`/categoria/${c.slug}`} className="shrink-0 rounded-full border border-cream-300 bg-white px-4 py-2 text-sm hover:border-ink">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <HomeSection title="Destacados" link="/catalogo" loading={isLoading} products={data?.featured} />
          <HomeSection title="Recién llegados" link="/catalogo?sort=newest" loading={isLoading} products={data?.newest} />
        </>
      )}
    </>
  );
}

function HomeSection({ title, link, loading, products }: { title: string; link: string; loading: boolean; products?: Parameters<typeof ProductGrid>[0]['products'] }) {
  if (!loading && (!products || products.length === 0)) return null;
  return (
    <section className="container-page mt-14">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-3xl">{title}</h2>
        <Link to={link} className="text-sm font-medium underline underline-offset-4">Ver todo</Link>
      </div>
      {loading ? <ProductGridSkeleton count={4} /> : <ProductGrid products={products!} />}
    </section>
  );
}
