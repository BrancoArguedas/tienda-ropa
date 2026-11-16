import { beforeEach, describe, expect, it } from 'vitest';
import { cartSelectors, useCartStore, type CartItem } from './cartStore';

const item = (overrides: Partial<CartItem> = {}): Omit<CartItem, 'quantity'> => ({
  variantId: 1,
  productId: 10,
  slug: 'vestido',
  name: 'Vestido',
  image: null,
  colorName: 'Negro',
  sizeName: 'M',
  unitPrice: '79.90',
  originalPrice: '99.90',
  stock: 3,
  ...overrides,
});

describe('cartStore', () => {
  beforeEach(() => useCartStore.getState().clear());

  it('agrupa por variante y no supera el stock disponible', () => {
    const { add } = useCartStore.getState();
    add(item(), 2);
    add(item(), 5);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it('distingue variantes distintas del mismo producto', () => {
    const { add } = useCartStore.getState();
    add(item());
    add(item({ variantId: 2, sizeName: 'L' }));
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('mantiene la cantidad entre 1 y el stock', () => {
    const { add, setQuantity } = useCartStore.getState();
    add(item());
    setQuantity(1, 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    setQuantity(1, 50);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('calcula totales sin errores de coma flotante', () => {
    const { add } = useCartStore.getState();
    add(item({ unitPrice: '0.10', originalPrice: '0.20', stock: 10 }), 3);
    const state = useCartStore.getState();
    expect(cartSelectors.count(state)).toBe(3);
    expect(cartSelectors.total(state)).toBe(0.3);
    expect(cartSelectors.subtotal(state)).toBe(0.6);
  });

  it('se guarda en localStorage', () => {
    useCartStore.getState().add(item());
    expect(localStorage.getItem('tienda-cart')).toContain('"variantId":1');
  });
});
