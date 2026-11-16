import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { getApiError } from '@/shared/api/httpClient';
import { toast } from '@/shared/ui/toast';
import { adminApi, type OrderListParams, type ProductListParams } from '../adminApi';
import type { AdminCategory, AdminOrder, ComplaintStatus, ProductPayload } from '../types';

/* ---------- Lecturas ---------- */

export const useDashboard = () =>
  useQuery({ queryKey: queryKeys.admin.dashboard, queryFn: ({ signal }) => adminApi.dashboard(signal), staleTime: 60_000 });

/** Catálogos auxiliares (categorías, tallas, colores) en una sola llamada compartida por los formularios. */
export const useCatalogOptions = () =>
  useQuery({ queryKey: queryKeys.admin.options, queryFn: ({ signal }) => adminApi.options(signal), staleTime: 5 * 60_000 });

export const useAdminCategories = () =>
  useQuery({ queryKey: queryKeys.admin.categories, queryFn: ({ signal }) => adminApi.categories(signal) });

export const useAdminProducts = (params: ProductListParams, enabled = true) =>
  useQuery({
    queryKey: queryKeys.admin.products.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => adminApi.products(params, signal),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useAdminProduct = (id: number | undefined) =>
  useQuery({
    queryKey: queryKeys.admin.products.detail(id ?? 0),
    queryFn: ({ signal }) => adminApi.product(id!, signal),
    enabled: !!id,
  });

export const useAdminPromotions = (page: number) =>
  useQuery({ queryKey: queryKeys.admin.promotions.list(page), queryFn: ({ signal }) => adminApi.promotions(page, signal), placeholderData: keepPreviousData });

export const useAdminPromotion = (id: number | undefined) =>
  useQuery({ queryKey: queryKeys.admin.promotions.detail(id ?? 0), queryFn: ({ signal }) => adminApi.promotion(id!, signal), enabled: !!id });

export const useAdminOrders = (params: OrderListParams) =>
  useQuery({
    queryKey: queryKeys.admin.orders.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => adminApi.orders(params, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000, // nuevos pedidos de WhatsApp aparecen solos
  });

export const useAdminOrder = (id: number) =>
  useQuery({ queryKey: queryKeys.admin.orders.detail(id), queryFn: ({ signal }) => adminApi.order(id, signal) });

export const useAdminSettings = () =>
  useQuery({ queryKey: queryKeys.admin.settings, queryFn: ({ signal }) => adminApi.settings(signal) });

/* ---------- Mutaciones (invalidan solo las claves afectadas) ---------- */

const onError = (error: unknown) => toast.error(getApiError(error).message);

export function useSaveProduct(id?: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductPayload) => adminApi.saveProduct(payload, id),
    onSuccess: (product) => {
      client.setQueryData(queryKeys.admin.products.detail(product.id), product);
      client.invalidateQueries({ queryKey: ['admin', 'products', 'list'] });
      client.invalidateQueries({ queryKey: ['store'] });
      toast.success('Producto guardado');
    },
  });
}

export function useDeleteProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteProduct,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin', 'products', 'list'] });
      client.invalidateQueries({ queryKey: ['store'] });
      toast.success('Producto eliminado');
    },
    onError,
  });
}

export function useOrderTransition(orderId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ action, comment }: { action: 'confirm' | 'cancel'; comment?: string }) => adminApi.transitionOrder(orderId, action, comment),
    onSuccess: (order: AdminOrder) => {
      client.setQueryData(queryKeys.admin.orders.detail(order.id), order);
      client.invalidateQueries({ queryKey: queryKeys.admin.orders.all, exact: false, predicate: (q) => q.queryKey[2] === 'list' });
      client.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      client.invalidateQueries({ queryKey: ['store'] }); // el stock cambió
      toast.success(order.status === 'confirmed' ? 'Venta confirmada: stock actualizado' : 'Pedido marcado como no concretado');
    },
  });
}

export function useInvalidateCatalog() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: queryKeys.admin.options });
    client.invalidateQueries({ queryKey: queryKeys.admin.categories });
    client.invalidateQueries({ queryKey: ['store'] });
  };
}

/** Mutación genérica de catálogos auxiliares: al terminar invalida opciones, categorías y tienda. */
function useCatalogMutation<TVars>(mutationFn: (vars: TVars) => Promise<unknown>, successMessage: string, withErrorToast = false) {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      invalidate();
      toast.success(successMessage);
    },
    onError: withErrorToast ? onError : undefined,
  });
}

type SaveVars<T> = { payload: T; id?: number };

export const useSaveCategory = () =>
  useCatalogMutation(({ payload, id }: SaveVars<Partial<AdminCategory>>) => adminApi.saveCategory(payload, id), 'Categoría guardada');
export const useDeleteCategory = () => useCatalogMutation((id: number) => adminApi.deleteCategory(id), 'Categoría eliminada', true);

export const useSaveSize = () =>
  useCatalogMutation(({ payload, id }: SaveVars<{ name: string; position?: number }>) => adminApi.saveSize(payload, id), 'Talla guardada');
export const useDeleteSize = () => useCatalogMutation((id: number) => adminApi.deleteSize(id), 'Talla eliminada', true);

export const useSaveColor = () =>
  useCatalogMutation(({ payload, id }: SaveVars<{ name: string; hex: string }>) => adminApi.saveColor(payload, id), 'Color guardado');
export const useDeleteColor = () => useCatalogMutation((id: number) => adminApi.deleteColor(id), 'Color eliminado', true);

export function useSavePromotion(id?: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => adminApi.savePromotion(form, id),
    onSuccess: (promotion) => {
      client.setQueryData(queryKeys.admin.promotions.detail(promotion.id), promotion);
      client.invalidateQueries({ queryKey: ['admin', 'promotions', 'list'] });
      client.invalidateQueries({ queryKey: ['store'] }); // precios y banners cambian
      toast.success('Promoción guardada');
    },
  });
}

export function useDeletePromotion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deletePromotion,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin', 'promotions', 'list'] });
      client.invalidateQueries({ queryKey: ['store'] });
      toast.success('Promoción eliminada');
    },
    onError,
  });
}

/* ---------- Derechos ARCO ---------- */

export function useAnonymizeOrder(orderId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => adminApi.anonymizeOrder(orderId),
    onSuccess: (order: AdminOrder) => {
      client.setQueryData(queryKeys.admin.orders.detail(order.id), order);
      client.invalidateQueries({ queryKey: queryKeys.admin.orders.all, exact: false, predicate: (q) => q.queryKey[2] === 'list' });
      toast.success('Datos personales anonimizados');
    },
    onError,
  });
}

/* ---------- Libro de Reclamaciones ---------- */

export const useAdminComplaints = (params: { status?: ComplaintStatus; q?: string; page?: number }) =>
  useQuery({
    queryKey: queryKeys.admin.complaints.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => adminApi.complaints(params, signal),
    placeholderData: keepPreviousData,
  });

export const useAdminComplaint = (id: number) =>
  useQuery({ queryKey: queryKeys.admin.complaints.detail(id), queryFn: ({ signal }) => adminApi.complaint(id, signal) });

export function useAnswerComplaint(id: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (response: string) => adminApi.answerComplaint(id, response),
    onSuccess: (complaint) => {
      client.setQueryData(queryKeys.admin.complaints.detail(id), complaint);
      client.invalidateQueries({ queryKey: queryKeys.admin.complaints.all, exact: false, predicate: (q) => q.queryKey[2] === 'list' });
      toast.success('Respuesta enviada al consumidor');
    },
  });
}

export function useSaveSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: adminApi.saveSettings,
    onSuccess: (settings) => {
      client.setQueryData(queryKeys.admin.settings, settings);
      client.invalidateQueries({ queryKey: queryKeys.store.settings });
      toast.success('Ajustes guardados');
    },
  });
}
