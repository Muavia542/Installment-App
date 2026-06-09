import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface RecentPayment {
  id: string;
  amount: number;
  payment_date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  created_at: string;
  deals: {
    id: string;
    product_name: string;
    clients: {
      id: string;
      profiles: {
        name: string;
      } | null;
    } | null;
  } | null;
}

export interface OverdueDeal {
  id: string;
  product_name: string;
  remaining_amount: number;
  clients: {
    profiles: { name: string } | null;
  } | null;
  overduePayments: {
    deal_id: string;
    amount: number;
    payment_date: string;
  }[];
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('monthly_installment, remaining_amount')
        .eq('status', 'ACTIVE');
      
      if (dealsError) throw dealsError;

      const { count: overdueCount, error: overdueError } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'OVERDUE');

      if (overdueError) throw overdueError;

      const activeCount = deals.length;
      const expectedRevenue = deals.reduce((sum, deal) => sum + Number(deal.monthly_installment), 0);
      const remainingBalance = deals.reduce((sum, deal) => sum + Number(deal.remaining_amount), 0);

      return {
        activeCount,
        expectedRevenue,
        remainingBalance,
        overdueCount: overdueCount || 0,
      };
    }
  });
};

export const useRecentPayments = () => {
  return useQuery({
    queryKey: ['adminRecentPayments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          status,
          created_at,
          deals (
            id,
            product_name,
            clients (
              id,
              profiles (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data as unknown) as RecentPayment[];
    }
  });
};

export const useOverdueDeals = () => {
  return useQuery({
    queryKey: ['adminOverdueDeals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          id,
          product_name,
          remaining_amount,
          clients (
            profiles (name)
          )
        `)
        .eq('status', 'ACTIVE');
        
      if (error) throw error;
      
      // Secondary query since querying filtered nested tables can be tricky in basic Supabase
      const { data: overduePayments, error: paymentError } = await supabase
        .from('payments')
        .select('deal_id, amount, payment_date')
        .eq('status', 'OVERDUE');
        
      if (paymentError) throw paymentError;

      const overdueDeals = data.filter(deal => 
        overduePayments.some(payment => payment.deal_id === deal.id)
      );

      return overdueDeals.map(deal => {
        return {
          ...deal,
          overduePayments: overduePayments.filter(p => p.deal_id === deal.id)
        };
      });
    }
  });
};
