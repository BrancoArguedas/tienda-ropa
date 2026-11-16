import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { storeApi } from '@/features/store/storeApi';

/** Ficha completa (variantes, imágenes, promoción y relacionados) en UNA petición. */
export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.store.product(slug),
    queryFn: ({ signal }) => storeApi.product(slug, signal),
    staleTime: 60_000,
    retry: (count, error) => !(error as { response?: { status?: number } }).response?.status && count < 2,
  });
}
