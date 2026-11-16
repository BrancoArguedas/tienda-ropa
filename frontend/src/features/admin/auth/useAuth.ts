import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { isStatus } from '@/shared/api/httpClient';
import { adminApi } from '../adminApi';

/** Sesión del admin. 401 = no autenticado (no se reintenta). */
export function useCurrentAdmin() {
  return useQuery({
    queryKey: queryKeys.admin.me,
    queryFn: ({ signal }) => adminApi.me(signal).catch((error) => {
      if (isStatus(error, 401)) return null;
      throw error;
    }),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: adminApi.login,
    onSuccess: (user) => client.setQueryData(queryKeys.admin.me, user),
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: adminApi.logout,
    onSettled: () => {
      client.removeQueries({ queryKey: ['admin'] });
      client.setQueryData(queryKeys.admin.me, null);
    },
  });
}
