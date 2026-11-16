import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/shared/api/queryKeys';
import { formatCurrency } from '@/shared/lib/format';
import { storeApi } from './storeApi';

export function useStoreSettings() {
  return useQuery({
    queryKey: queryKeys.store.settings,
    queryFn: ({ signal }) => storeApi.settings(signal),
    staleTime: Infinity, // cambia muy poco: una sola petición por sesión
  });
}

/** Formateador de dinero con la moneda/idioma configurados en el admin. */
export function useMoney() {
  const { data } = useStoreSettings();
  const currency = data?.currency_code ?? 'PEN';
  const locale = data?.locale ?? 'es-PE';
  return useCallback((amount: string | number) => formatCurrency(amount, currency, locale), [currency, locale]);
}
