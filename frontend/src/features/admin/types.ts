export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
}

export interface AdminCategory {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  position: number;
  is_active: boolean;
  products_count?: number;
}

export interface CatalogOptions {
  categories: { id: number; parent_id: number | null; name: string; is_active: boolean }[];
  sizes: { id: number; name: string; position: number }[];
  colors: { id: number; name: string; hex: string }[];
}

export interface AdminProductListItem {
  id: number;
  name: string;
  slug: string;
  base_price: string;
  is_active: boolean;
  is_featured: boolean;
  category: { id: number; name: string };
  thumb: string | null;
  stock_total: number;
  variants_count: number;
  updated_at: string;
}

export interface AdminVariant {
  id?: number;
  size_id: number;
  color_id: number;
  sku: string | null;
  stock: number;
  price_override: string | null;
}

export interface AdminImage {
  id: number;
  color_id: number | null;
  position: number;
  is_primary: boolean;
  thumb: string;
  large: string;
}

export interface AdminProduct {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  base_price: string;
  is_active: boolean;
  is_featured: boolean;
  variants: AdminVariant[];
  images: AdminImage[];
}

export interface ProductPayload {
  category_id: number;
  name: string;
  slug?: string;
  description?: string | null;
  base_price: string;
  is_active: boolean;
  is_featured: boolean;
  variants: Omit<AdminVariant, 'id'>[];
}

export interface AdminPromotion {
  id: number;
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed';
  value: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  is_current: boolean;
  banner: string | null;
  products_count?: number;
  categories_count?: number;
  products?: { id: number; name: string }[];
  category_ids?: number[];
}

export interface OrderItem {
  id: number;
  product_variant_id: number;
  product_name: string;
  sku: string;
  size_name: string;
  color_name: string;
  unit_price: string;
  unit_discount: string;
  quantity: number;
  line_total: string;
}

export interface OrderHistory {
  id: number;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  to_label: string;
  comment: string | null;
  user: string | null;
  created_at: string;
}

export interface AdminOrder {
  id: number;
  code: string;
  customer_name: string;
  customer_phone: string | null; // null tras anonimizar (ARCO)
  notes: string | null;
  anonymized_at: string | null;
  privacy_accepted_at: string | null;
  status: OrderStatus;
  status_label: string;
  subtotal: string;
  discount_total: string;
  total: string;
  items_count?: number;
  whatsapp_message?: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  handler?: { id: number; name: string } | null;
  items?: OrderItem[];
  histories?: OrderHistory[];
}

export interface Dashboard {
  orders_by_status: Record<OrderStatus, number>;
  month: { orders: number; revenue: string };
  sales_last_30_days: { day: string; orders: number; revenue: string }[];
  top_products: { product_name: string; units: number; revenue: string }[];
  low_stock: { id: number; stock: number; sku: string; product_id: number; product_name: string; size_name: string; color_name: string }[];
  recent_orders: { id: number; code: string; customer_name: string; status: OrderStatus; total: string; created_at: string }[];
}

export type AdminSettings = Record<
  | 'store_name' | 'store_tagline' | 'whatsapp_number' | 'currency_code' | 'locale' | 'instagram_url' | 'facebook_url' | 'tiktok_url' | 'address' | 'size_guide'
  | 'legal_name' | 'ruc' | 'legal_address' | 'privacy_email' | 'claims_email' | 'data_retention_months',
  string
>;

export type ComplaintStatus = 'pending' | 'answered';

export interface AdminComplaintSummary {
  id: number;
  number: string;
  type: 'claim' | 'complaint';
  type_label: string;
  consumer_name: string;
  status: ComplaintStatus;
  due_at: string;
  overdue: boolean;
  created_at: string;
  answered_at: string | null;
}

export interface AdminComplaint extends AdminComplaintSummary {
  document_type: string;
  document_number: string;
  address: string;
  phone: string;
  email: string;
  is_minor: boolean;
  guardian_name: string | null;
  item_type: 'product' | 'service';
  item_type_label: string;
  amount: string | null;
  item_description: string;
  order_code: string | null;
  detail: string;
  consumer_request: string;
  provider_response: string | null;
  answered_by: string | null;
}

export interface ComplaintList {
  data: AdminComplaintSummary[];
  meta: { current_page: number; last_page: number; total: number };
  counts: { pending: number; overdue: number };
}
