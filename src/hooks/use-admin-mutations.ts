import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useRecordPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealId, clientUserId, amount, paymentDate, receiptFile }: { dealId: string; clientUserId: string; amount: number; paymentDate: string; receiptFile?: File }) => {
      let receiptUrl = null;

      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${dealId}-${Date.now()}.${fileExt}`;
        const filePath = `${clientUserId}/receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, receiptFile, { upsert: false });

        if (uploadError) throw new Error('Failed to upload receipt: ' + uploadError.message);

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath);

        receiptUrl = publicUrl;
      }

      const { data, error } = await supabase.rpc('record_payment', {
        p_deal_id: dealId,
        p_amount: amount,
        p_payment_date: paymentDate,
        p_receipt_url: receiptUrl
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDeals'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentPayments'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverdueDeals'] });
    }
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, address, cnic }: { id: string; address: string; cnic: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update({ address, cnic })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (updatedClient) => {
      await queryClient.cancelQueries({ queryKey: ['adminClients'] });

      // Assuming we have multiple pages, we might just want to invalidate or handle a complex optimistic update.
      // But we can just invalidate to be totally safe, or try to update all caches.
      // Let's do a simple optimistic cache update for the specific keys if possible, but simpler is to just let it refetch or update the exact query if we know it.
      // For now, we'll just return the context and invalidate on success.
      return { id: updatedClient.id };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adminClients'] });
    },
  });
};
