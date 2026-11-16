import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductQueryParams } from '@/features/store/storeApi';

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Novedades' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name', label: 'Nombre A-Z' },
] as const;

const toNumbers = (values: string[]) => values.map(Number).filter((n) => Number.isFinite(n) && n > 0);

/**
 * Los filtros viven en la URL: se pueden compartir, el botón "atrás" funciona
 * y la clave de caché de TanStack Query se deriva de aquí.
 */
export function useCatalogParams(fixed: Partial<ProductQueryParams> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo<Omit<ProductQueryParams, 'page'>>(() => {
    const min = searchParams.get('min_price');
    const max = searchParams.get('max_price');
    return {
      category: fixed.category ?? searchParams.get('category') ?? undefined,
      q: searchParams.get('q') ?? undefined,
      sizes: toNumbers(searchParams.getAll('sizes')),
      colors: toNumbers(searchParams.getAll('colors')),
      min_price: min ? Number(min) : undefined,
      max_price: max ? Number(max) : undefined,
      on_sale: fixed.on_sale ?? (searchParams.get('on_sale') === '1' || undefined),
      sort: searchParams.get('sort') ?? 'newest',
    };
  }, [searchParams, fixed.category, fixed.on_sale]);

  const update = useCallback(
    (patch: Partial<Record<'q' | 'sort' | 'min_price' | 'max_price', string | undefined>> & { sizes?: number[]; colors?: number[] }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            next.delete(key);
            if (Array.isArray(value)) value.forEach((v) => next.append(key, String(v)));
            else if (value !== undefined && value !== '') next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clear = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      const q = prev.get('q');
      if (q) next.set('q', q);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const activeCount = (params.sizes?.length ?? 0) + (params.colors?.length ?? 0) + (params.min_price || params.max_price ? 1 : 0);

  return { params, update, clear, activeCount };
}
