import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProduct } from '@/features/product/useProduct';
import { useVariantSelection } from '@/features/product/useVariantSelection';
import { ProductGallery } from '@/features/product/components/ProductGallery';
import { VariantSelector } from '@/features/product/components/VariantSelector';
import { ProductDetailSkeleton } from '@/features/product/components/ProductDetailSkeleton';
import { PriceTag } from '@/features/catalog/components/PriceTag';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { QuantityStepper } from '@/features/cart/components/QuantityStepper';
import { useCartStore, useCartUi } from '@/features/cart/cartStore';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { isStatus } from '@/shared/api/httpClient';
import type { ProductDetail } from '@/shared/api/types';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { EmptyState, ErrorState } from '@/shared/ui/EmptyState';
import { Icon } from '@/shared/ui/Icon';
import { Modal } from '@/shared/ui/Modal';
import { toast } from '@/shared/ui/toast';

export function ProductPage() {
  const { slug = '' } = useParams();
  const { data, isLoading, error, refetch } = useProduct(slug);

  if (isLoading) return <ProductDetailSkeleton />;
  if (isStatus(error, 404)) {
    return <EmptyState title="Producto no disponible" description="Es posible que ya no esté a la venta." action={<Link to="/catalogo" className="underline">Ver catálogo</Link>} />;
  }
  if (error || !data) return <ErrorState onRetry={() => refetch()} />;

  // `key` reinicia la selección al navegar entre productos relacionados.
  return <ProductView key={data.id} product={data} />;
}

function ProductView({ product }: { product: ProductDetail }) {
  const selection = useVariantSelection(product);
  const [quantity, setQuantity] = useState(1);
  const [guideOpen, setGuideOpen] = useState(false);
  const [sizeHint, setSizeHint] = useState(false);
  const add = useCartStore((s) => s.add);
  const openCart = useCartUi((s) => s.setOpen);
  const { data: settings } = useStoreSettings();

  const maxQty = selection.variant ? Math.min(selection.variant.stock, 99) : 1;

  const addToCart = () => {
    if (!selection.variant || !selection.color || !selection.size) {
      setSizeHint(true);
      return;
    }
    add(
      {
        variantId: selection.variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: selection.images[0]?.thumb ?? null,
        colorName: selection.color.name,
        sizeName: selection.size.name,
        unitPrice: selection.price.final,
        originalPrice: selection.price.original,
        stock: selection.variant.stock,
      },
      quantity,
    );
    toast.success(`${product.name} agregado al carrito`);
    openCart(true);
  };

  return (
    <div className="container-page py-8">
      <nav className="mb-6 flex items-center gap-1 text-xs text-ink-muted" aria-label="Ruta">
        <Link to="/" className="hover:text-ink">Inicio</Link>
        <Icon name="chevronRight" className="h-3 w-3" />
        <Link to={`/categoria/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
        <Icon name="chevronRight" className="h-3 w-3" />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
        <ProductGallery images={selection.images} alt={`${product.name} ${selection.color?.name ?? ''}`} />

        <div className="md:sticky md:top-24 md:self-start">
          <div className="mb-3 flex gap-2">
            {product.price.promotion && <Badge tone="clay">{product.price.promotion.badge} · {product.price.promotion.name}</Badge>}
            {product.is_new && <Badge tone="dark">Nuevo</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl">{product.name}</h1>
          <div className="mt-3">
            <PriceTag price={selection.price} size="lg" />
          </div>

          <div className="mt-8">
            <VariantSelector
              colors={product.colors}
              sizes={product.sizes}
              colorId={selection.colorId}
              sizeId={selection.sizeId}
              stockBySize={selection.stockBySize}
              onColor={(id) => {
                selection.selectColor(id);
                setQuantity(1);
              }}
              onSize={(id) => {
                selection.selectSize(id);
                setSizeHint(false);
                setQuantity(1);
              }}
              onSizeGuide={settings?.size_guide ? () => setGuideOpen(true) : undefined}
            />
            {sizeHint && <p className="mt-2 text-sm text-red-700" role="alert">Elige una talla para continuar.</p>}
          </div>

          <div className="mt-8 flex items-center gap-3">
            <QuantityStepper value={quantity} max={maxQty} onChange={setQuantity} />
            <Button size="lg" className="flex-1" onClick={addToCart} disabled={selection.soldOut}>
              <Icon name="bag" /> {selection.soldOut ? 'Agotado' : 'Agregar al carrito'}
            </Button>
          </div>

          {product.description && (
            <div className="mt-10 border-t border-cream-300 pt-6">
              <h2 className="mb-2 font-sans text-sm font-semibold uppercase tracking-widest">Descripción</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {product.related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-3xl">También te puede gustar</h2>
          <ProductGrid products={product.related.slice(0, 4)} />
        </section>
      )}

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="Guía de tallas">
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{settings?.size_guide}</p>
      </Modal>
    </div>
  );
}
