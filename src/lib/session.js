import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export function useMe() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const isDemo = typeof window !== 'undefined' && localStorage.getItem('kinetic-demo-mode') === 'true';
      if (isDemo) {
        return { id: 'demo-user-01', email: 'demo@kinetic.app', name: 'Alex' };
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) return null;

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) return null;

        const email = userData.user.email || '';
        const meta = userData.user.user_metadata;
        const name = meta?.name || meta?.full_name || email.split('@')[0];

        return { id: userData.user.id, email, name };
      } catch (err) {
        console.error('Session check failed:', err);
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  return { data: data ?? null, isPending, isError, error };
}
