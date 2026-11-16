import { useMemo, useState } from 'react';
import type { ProductDetail } from '@/shared/api/types';

/** Lógica de selección color/talla separada de la vista (SRP). */
export function useVariantSelection(product: ProductDetail) {
  const firstColorInStock = product.colors.find((c) => product.variants.some((v) => v.color_id === c.id && v.stock > 0));
  const [colorId, setColorId] = useState<number | null>(firstColorInStock?.id ?? product.colors[0]?.id ?? null);
  const [sizeId, setSizeId] = useState<number | null>(null);

  const stockBySize = useMemo(() => {
    const map = new Map<number, number>();
    for (const v of product.variants) {
      if (v.color_id === colorId) map.set(v.size_id, v.stock);
    }
    return map;
  }, [product.variants, colorId]);

  const variant = useMemo(
    () => product.variants.find((v) => v.color_id === colorId && v.size_id === sizeId) ?? null,
    [product.variants, colorId, sizeId],
  );

  const images = useMemo(() => {
    const forColor = product.images.filter((img) => img.color_id === colorId || img.color_id === null);
    return forColor.length > 0 ? forColor : product.images;
  }, [product.images, colorId]);

  const selectColor = (id: number) => {
    setColorId(id);
    // Si la talla elegida no existe/no tiene stock en el nuevo color, se limpia.
    const stillAvailable = product.variants.some((v) => v.color_id === id && v.size_id === sizeId && v.stock > 0);
    if (!stillAvailable) setSizeId(null);
  };

  return {
    colorId,
    sizeId,
    variant,
    images,
    stockBySize,
    selectColor,
    selectSize: setSizeId,
    price: variant?.price ?? product.price,
    color: product.colors.find((c) => c.id === colorId) ?? null,
    size: product.sizes.find((s) => s.id === sizeId) ?? null,
    soldOut: !product.variants.some((v) => v.stock > 0),
  };
}
