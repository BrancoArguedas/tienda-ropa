import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { storeApi, type ProductQueryParams } from '@/features/store/storeApi';

export function useCatalogFilters() {
  return useQuery({
    queryKey: queryKeys.store.filters,
    queryFn: ({ signal }) => storeApi.filters(signal),
    staleTime: 10 * 60_000,
  });
}

export function useHome() {
  return useQuery({
    queryKey: queryKeys.store.home,
    queryFn: ({ signal }) => storeApi.home(signal),
    staleTime: 2 * 60_000,
  });
}

/** Catálogo con "cargar más": cada página se pide una sola vez y queda en caché. */
export function useInfiniteProducts(params: Omit<ProductQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.store.products(params as Record<string, unknown>),
    queryFn: ({ pageParam, signal }) => storeApi.products({ ...params, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Autocompletado. Recibe el término YA debounced; la petición anterior se cancela con `signal`. */
export function useSuggestions(term: string) {
  const normalized = term.trim().toLowerCase();
  return useQuery({
    queryKey: queryKeys.store.suggest(normalized),
    queryFn: ({ signal }) => storeApi.suggest(normalized, signal),
    enabled: normalized.length >= 2,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}
