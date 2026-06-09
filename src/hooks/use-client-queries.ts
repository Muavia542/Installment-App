import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export const useClientDashboard = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['clientDashboard', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: deals, error } = await supabase
        .from('deals')
        .select('*')
        .eq('status', 'ACTIVE');
        // RLS restricts to their own deals.

      if (error) throw error;
      
      const activeDeals = deals.length;
      const remainingBalance = deals.reduce((sum, d) => sum + Number(d.remaining_amount), 0);
      
      // Calculate next due date
      let nextDue: Date | null = null;
      let nextInstallmentAmount = 0;
      
      for (const deal of deals) {
        if (deal.status !== 'ACTIVE') continue;
        const dealNextDue = new Date(deal.next_payment_date);
        if (!nextDue || dealNextDue < nextDue) {
          nextDue = dealNextDue;
          nextInstallmentAmount = Number(deal.installment_amount); // approximate
        }
      }

      return {
        activeDeals,
        remainingBalance,
        nextDueDate: nextDue ? nextDue.toISOString() : null,
        nextInstallmentAmount
      };
    },
    enabled: !!user
  });
};

export const useClientDeals = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['clientDeals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
};

export const useClientPayments = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['clientPayments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, deals(product_name)')
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
};

export const useClientProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['clientProfile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // ignore not found
      return data;
    },
    enabled: !!user
  });
};
