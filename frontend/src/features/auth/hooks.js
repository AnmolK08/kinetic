import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiSignUp, apiSignIn } from '@/lib/api';

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password, name }) => {
      const res = await apiSignUp({ email, password, name });
      return res;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await apiSignIn({ email, password });
      return res;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem('kinetic_auth_token');
      localStorage.removeItem('kinetic-demo-mode');
    },
    onSuccess: () => {
      void qc.clear();
    },
  });
}
