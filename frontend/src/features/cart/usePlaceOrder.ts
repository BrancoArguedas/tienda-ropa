import { useMutation } from '@tanstack/react-query';
import { storeApi, type PlaceOrderPayload } from '@/features/store/storeApi';

export function usePlaceOrder() {
  return useMutation({
    mutationFn: (payload: PlaceOrderPayload) => storeApi.placeOrder(payload),
  });
}
