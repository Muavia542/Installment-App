import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ phone, address }: { phone: string; address: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('clients')
        .update({ phone, address })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw new Error('Failed to update profile: ' + error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile', user?.id] });
    }
  });
};
