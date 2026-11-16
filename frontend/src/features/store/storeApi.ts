import { http } from '@/shared/api/httpClient';
import type { CatalogFilters, ComplaintReceipt, HomeData, Paginated, PlacedOrder, ProductCard, ProductDetail, StoreSettings, Suggestions } from '@/shared/api/types';

/** Capa de acceso HTTP de la tienda pública: los componentes nunca usan axios directamente. */
export interface ProductQueryParams {
  category?: string;
  sizes?: number[];
  colors?: number[];
  min_price?: number;
  max_price?: number;
  q?: string;
  on_sale?: boolean;
  sort?: string;
  page?: number;
}

export interface PlaceOrderPayload {
  customer_name: string;
  customer_phone: string;
  notes?: string;
  privacy_accepted: boolean;
  website?: string; // honeypot
  items: { variant_id: number; quantity: number }[];
}

export interface ComplaintPayload {
  consumer_name: string;
  document_type: 'DNI' | 'CE' | 'PAS' | 'RUC';
  document_number: string;
  address: string;
  phone: string;
  email: string;
  is_minor: boolean;
  guardian_name?: string;
  item_type: 'product' | 'service';
  amount?: number;
  item_description: string;
  order_code?: string;
  type: 'claim' | 'complaint';
  detail: string;
  consumer_request: string;
  accepted: boolean;
  website?: string; // honeypot
}

export const storeApi = {
  settings: (signal?: AbortSignal) => http.get<StoreSettings>('/store', { signal }).then((r) => r.data),
  home: (signal?: AbortSignal) => http.get<HomeData>('/home', { signal }).then((r) => r.data),
  filters: (signal?: AbortSignal) => http.get<CatalogFilters>('/catalog/filters', { signal }).then((r) => r.data),
  products: (params: ProductQueryParams, signal?: AbortSignal) =>
    http.get<Paginated<ProductCard>>('/products', { params: { ...params, on_sale: params.on_sale ? 1 : undefined }, signal }).then((r) => r.data),
  suggest: (q: string, signal?: AbortSignal) => http.get<Suggestions>('/products/suggest', { params: { q }, signal }).then((r) => r.data),
  product: (slug: string, signal?: AbortSignal) => http.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { signal }).then((r) => r.data),
  placeOrder: (payload: PlaceOrderPayload) => http.post<PlacedOrder>('/orders', payload).then((r) => r.data),
  fileComplaint: (payload: ComplaintPayload) => http.post<ComplaintReceipt>('/complaints', payload).then((r) => r.data),
};
