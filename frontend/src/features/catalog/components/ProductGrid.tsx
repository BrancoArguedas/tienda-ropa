import type { ProductCard as ProductCardData } from '@/shared/api/types';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4';

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className={gridClass}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={gridClass} role="status" aria-label="Cargando productos">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
