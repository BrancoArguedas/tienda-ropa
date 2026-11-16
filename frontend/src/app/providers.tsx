import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { isStatus } from '@/shared/api/httpClient';
import { Toaster } from '@/shared/ui/toast';

/**
 * Valores por defecto de TanStack Query:
 * - staleTime evita repetir peticiones al volver a montar una vista (incluye el doble montaje de StrictMode).
 * - No se reintenta un 4xx (no va a cambiar), solo errores de red/5xx una vez.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          for (const status of [400, 401, 403, 404, 422]) if (isStatus(error, status)) return false;
          return failureCount < 1;
        },
      },
      mutations: { retry: false },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
