import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { ProductCard as ProductCardData } from '@/shared/api/types';
import { Badge } from '@/shared/ui/Badge';
import { Skeleton } from '@/shared/ui/Skeleton';
import { PriceTag } from './PriceTag';

/** Componente de presentación: recibe datos, no hace peticiones. */
export const ProductCard = memo(function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link to={`/producto/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-cream-200">
        {product.image ? (
          <img
            src={product.image.thumb}
            srcSet={`${product.image.thumb} 400w, ${product.image.large} 1200w`}
            sizes="(min-width: 1024px) 25vw, 50vw"
            alt={product.name}
            width={400}
            height={533}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-muted">Sin imagen</div>
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {product.price.promotion && <Badge tone="clay">{product.price.promotion.badge}</Badge>}
          {product.is_new && <Badge tone="dark">Nuevo</Badge>}
        </div>
        {!product.in_stock && (
          <div className="absolute inset-x-0 bottom-0 bg-ink/70 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-cream">
            Agotado
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 font-sans text-sm font-medium text-ink group-hover:underline group-hover:underline-offset-4">
          {product.name}
        </h3>
        <PriceTag price={product.price} />
        {product.colors.length > 0 && (
          <div className="flex items-center gap-1 pt-1" aria-label={`Colores: ${product.colors.map((c) => c.name).join(', ')}`}>
            {product.colors.slice(0, 5).map((color) => (
              <span key={color.id} className="h-3 w-3 rounded-full border border-ink/15" style={{ backgroundColor: color.hex }} title={color.name} />
            ))}
            {product.colors.length > 5 && <span className="text-xs text-ink-muted">+{product.colors.length - 5}</span>}
          </div>
        )}
      </div>
    </Link>
  );
});

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full rounded-xl" />
      <Skeleton className="mt-3 h-4 w-4/5" />
      <Skeleton className="mt-2 h-4 w-1/3" />
      <div className="mt-2 flex gap-1">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-3 rounded-full" />
      </div>
    </div>
  );
}
