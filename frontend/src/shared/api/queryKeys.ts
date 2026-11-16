/**
 * Claves de caché centralizadas: TanStack Query deduplica peticiones con la misma clave
 * y permite invalidar solo lo afectado tras una mutación.
 */
export const queryKeys = {
  store: {
    settings: ['store', 'settings'] as const,
    home: ['store', 'home'] as const,
    filters: ['store', 'filters'] as const,
    products: (params: Record<string, unknown>) => ['store', 'products', params] as const,
    suggest: (term: string) => ['store', 'suggest', term] as const,
    product: (slug: string) => ['store', 'product', slug] as const,
  },
  admin: {
    me: ['admin', 'me'] as const,
    dashboard: ['admin', 'dashboard'] as const,
    options: ['admin', 'options'] as const,
    categories: ['admin', 'categories'] as const,
    products: {
      all: ['admin', 'products'] as const,
      list: (params: Record<string, unknown>) => ['admin', 'products', 'list', params] as const,
      detail: (id: number) => ['admin', 'products', 'detail', id] as const,
    },
    promotions: {
      all: ['admin', 'promotions'] as const,
      list: (page: number) => ['admin', 'promotions', 'list', page] as const,
      detail: (id: number) => ['admin', 'promotions', 'detail', id] as const,
    },
    orders: {
      all: ['admin', 'orders'] as const,
      list: (params: Record<string, unknown>) => ['admin', 'orders', 'list', params] as const,
      detail: (id: number) => ['admin', 'orders', 'detail', id] as const,
    },
    settings: ['admin', 'settings'] as const,
    complaints: {
      all: ['admin', 'complaints'] as const,
      list: (params: Record<string, unknown>) => ['admin', 'complaints', 'list', params] as const,
      detail: (id: number) => ['admin', 'complaints', 'detail', id] as const,
    },
  },
};
