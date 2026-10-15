import { useQuery } from '@tanstack/react-query';
import { apiGetMe } from './api';

export function useMe() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const isDemo = typeof window !== 'undefined' && localStorage.getItem('kinetic-demo-mode') === 'true';
      const token = typeof window !== 'undefined' ? localStorage.getItem('kinetic_auth_token') : null;

      if (!token && !isDemo) {
        return null;
      }

      try {
        const user = await apiGetMe();
        return user;
      } catch (err) {
        if (isDemo) {
          return { id: 'demo-user-01', email: 'demo@kinetic.app', name: 'Alex' };
        }
        console.error('Session check failed:', err);
        return null;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  return { data: data ?? null, isPending, isError, error };
}
