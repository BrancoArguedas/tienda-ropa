import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CartItem {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  image: string | null;
  colorName: string;
  sizeName: string;
  /** Precio mostrado al agregar. Es referencial: el servidor recalcula al registrar el pedido. */
  unitPrice: string;
  originalPrice: string;
  stock: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
}

const clamp = (value: number, max: number) => Math.max(1, Math.min(value, Math.max(max, 1), 99));

/** Carrito persistido en el navegador, indexado por variante (talla + color). */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, ...item, quantity: clamp(i.quantity + quantity, item.stock) } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: clamp(quantity, item.stock) }] };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.variantId === variantId ? { ...i, quantity: clamp(quantity, i.stock) } : i)),
        })),
      remove: (variantId) => set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'tienda-cart', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

/** Selectores derivados (cálculo en céntimos para evitar errores de coma flotante). */
export const cartSelectors = {
  count: (state: CartState) => state.items.reduce((sum, i) => sum + i.quantity, 0),
  subtotal: (state: CartState) =>
    state.items.reduce((sum, i) => sum + Math.round(Number(i.originalPrice) * 100) * i.quantity, 0) / 100,
  total: (state: CartState) =>
    state.items.reduce((sum, i) => sum + Math.round(Number(i.unitPrice) * 100) * i.quantity, 0) / 100,
};

/** Estado de UI del carrito (separado de los datos: SRP). */
interface CartUiState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCartUi = create<CartUiState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
