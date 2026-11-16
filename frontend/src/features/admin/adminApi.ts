import { http } from '@/shared/api/httpClient';
import type { Paginated } from '@/shared/api/types';
import type {
  AdminCategory, AdminComplaint, AdminImage, AdminOrder, AdminProduct, AdminProductListItem, AdminPromotion,
  AdminSettings, AdminUser, CatalogOptions, ComplaintList, ComplaintStatus, Dashboard, OrderStatus, ProductPayload,
} from './types';

const data = <T,>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export interface OrderListParams {
  status?: OrderStatus;
  q?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface ProductListParams {
  q?: string;
  category_id?: number;
  status?: 'active' | 'inactive';
  page?: number;
  per_page?: number;
}

export type OrderList = Paginated<AdminOrder> & { counts: Record<OrderStatus, number> };

/** Acceso HTTP del panel. Los componentes consumen hooks, no este módulo directamente. */
export const adminApi = {
  login: (payload: { email: string; password: string }) => data(http.post<AdminUser>('/admin/login', payload)),
  me: (signal?: AbortSignal) => data(http.get<AdminUser>('/admin/me', { signal })),
  logout: () => http.post('/admin/logout'),

  dashboard: (signal?: AbortSignal) => data(http.get<Dashboard>('/admin/dashboard', { signal })),
  options: (signal?: AbortSignal) => data(http.get<CatalogOptions>('/admin/catalog-options', { signal })),

  categories: (signal?: AbortSignal) => data(http.get<AdminCategory[]>('/admin/categories', { signal })),
  saveCategory: (payload: Partial<AdminCategory>, id?: number) =>
    data(id ? http.put<AdminCategory>(`/admin/categories/${id}`, payload) : http.post<AdminCategory>('/admin/categories', payload)),
  deleteCategory: (id: number) => http.delete(`/admin/categories/${id}`),

  saveSize: (payload: { name: string; position?: number }, id?: number) =>
    data(id ? http.put(`/admin/sizes/${id}`, payload) : http.post('/admin/sizes', payload)),
  deleteSize: (id: number) => http.delete(`/admin/sizes/${id}`),
  saveColor: (payload: { name: string; hex: string }, id?: number) =>
    data(id ? http.put(`/admin/colors/${id}`, payload) : http.post('/admin/colors', payload)),
  deleteColor: (id: number) => http.delete(`/admin/colors/${id}`),

  products: (params: ProductListParams, signal?: AbortSignal) =>
    data(http.get<Paginated<AdminProductListItem>>('/admin/products', { params, signal })),
  product: (id: number, signal?: AbortSignal) => data(http.get<AdminProduct>(`/admin/products/${id}`, { signal })),
  saveProduct: (payload: ProductPayload, id?: number) =>
    data(id ? http.put<AdminProduct>(`/admin/products/${id}`, payload) : http.post<AdminProduct>('/admin/products', payload)),
  deleteProduct: (id: number) => http.delete(`/admin/products/${id}`),

  uploadImages: (productId: number, files: File[], colorId: number | null) => {
    const form = new FormData();
    files.forEach((f) => form.append('images[]', f));
    if (colorId) form.append('color_id', String(colorId));
    return data(http.post<AdminImage[]>(`/admin/products/${productId}/images`, form));
  },
  updateImage: (productId: number, imageId: number, payload: { color_id?: number | null; is_primary?: boolean }) =>
    data(http.patch<AdminImage>(`/admin/products/${productId}/images/${imageId}`, payload)),
  reorderImages: (productId: number, ids: number[]) => data(http.put<AdminImage[]>(`/admin/products/${productId}/images/reorder`, { ids })),
  deleteImage: (productId: number, imageId: number) => http.delete(`/admin/products/${productId}/images/${imageId}`),

  promotions: (page: number, signal?: AbortSignal) => data(http.get<Paginated<AdminPromotion>>('/admin/promotions', { params: { page }, signal })),
  promotion: (id: number, signal?: AbortSignal) => data(http.get<AdminPromotion>(`/admin/promotions/${id}`, { signal })),
  savePromotion: (form: FormData, id?: number) =>
    data(http.post<AdminPromotion>(id ? `/admin/promotions/${id}` : '/admin/promotions', form)),
  deletePromotion: (id: number) => http.delete(`/admin/promotions/${id}`),

  orders: (params: OrderListParams, signal?: AbortSignal) => data(http.get<OrderList>('/admin/orders', { params, signal })),
  order: (id: number, signal?: AbortSignal) => data(http.get<AdminOrder>(`/admin/orders/${id}`, { signal })),
  transitionOrder: (id: number, action: 'confirm' | 'cancel', comment?: string) =>
    data(http.patch<AdminOrder>(`/admin/orders/${id}/${action}`, { comment })),

  // Derechos ARCO
  anonymizeOrder: (id: number) => data(http.patch<AdminOrder>(`/admin/orders/${id}/anonymize`)),
  exportCustomerData: (phone: string) => data(http.get<unknown>('/admin/orders/export', { params: { phone } })),

  // Libro de Reclamaciones
  complaints: (params: { status?: ComplaintStatus; q?: string; page?: number }, signal?: AbortSignal) =>
    data(http.get<ComplaintList>('/admin/complaints', { params, signal })),
  complaint: (id: number, signal?: AbortSignal) => data(http.get<AdminComplaint>(`/admin/complaints/${id}`, { signal })),
  answerComplaint: (id: number, response: string) => data(http.patch<AdminComplaint>(`/admin/complaints/${id}/answer`, { response })),

  settings: (signal?: AbortSignal) => data(http.get<AdminSettings>('/admin/settings', { signal })),
  saveSettings: (payload: AdminSettings) => data(http.put<AdminSettings>('/admin/settings', payload)),
};
