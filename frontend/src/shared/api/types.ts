/** Tipos de las respuestas de la API (contrato con los Resources de Laravel). */

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export interface PromotionTag {
  id: number;
  name: string;
  badge: string;
  ends_at: string;
}

export interface Price {
  original: string;
  final: string;
  discount: string;
  promotion: PromotionTag | null;
}

export interface ColorOption {
  id: number;
  name: string;
  hex: string;
}

export interface SizeOption {
  id: number;
  name: string;
}

export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  children: CategoryNode[];
}

export interface ProductCard {
  id: number;
  name: string;
  slug: string;
  price: Price;
  image: { thumb: string; large: string } | null;
  colors: ColorOption[];
  in_stock: boolean;
  is_new: boolean;
}

export interface ProductImage {
  id: number;
  color_id: number | null;
  thumb: string;
  large: string;
}

export interface ProductVariant {
  id: number;
  size_id: number;
  color_id: number;
  stock: number;
  price: Price | null;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: { name: string; slug: string };
  price: Price;
  is_new: boolean;
  images: ProductImage[];
  colors: ColorOption[];
  sizes: SizeOption[];
  variants: ProductVariant[];
  related: ProductCard[];
}

export interface CatalogFilters {
  categories: CategoryNode[];
  sizes: SizeOption[];
  colors: ColorOption[];
  price_range: { min: number; max: number };
}

export interface StoreSettings {
  store_name: string;
  store_tagline: string;
  currency_code: string;
  locale: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  address: string;
  size_guide: string;
  legal: LegalInfo;
}

/** Datos del titular del banco de datos / proveedor (Ley 29733, Código del Consumidor). */
export interface LegalInfo {
  legal_name: string;
  ruc: string;
  legal_address: string;
  privacy_email: string;
  data_retention_months: number;
  privacy_policy_version: string;
}

export interface ComplaintReceipt {
  number: string;
  created_at: string;
  due_at: string;
  email: string;
}

export interface PromotionBanner {
  id: number;
  name: string;
  description: string | null;
  banner: string | null;
  ends_at: string;
}

export interface HomeData {
  featured: ProductCard[];
  newest: ProductCard[];
  promotions: PromotionBanner[];
}

export interface Suggestions {
  products: { id: number; name: string; slug: string; thumb: string | null; price: string }[];
  categories: { name: string; slug: string }[];
}

export interface PlacedOrder {
  code: string;
  total: string;
  whatsapp_url: string;
}
