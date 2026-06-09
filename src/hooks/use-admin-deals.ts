import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AdminDeal {
  id: string;
  client_id: string;
  product_name: string;
  total_amount: number;
  advance_payment: number;
  remaining_amount: number;
  installment_months: number;
  monthly_installment: number;
  start_date: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';
  created_at: string;
  clients: {
    user_id: string;
    cnic: string | null;
    profiles: {
      name: string;
      email: string;
      phone: string | null;
    } | null;
  } | null;
  installments: {
    id: string;
    due_date: string;
    amount: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
  }[];
  payments: {
    id: string;
    amount: number;
    payment_date: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
  }[];
}

export const useAdminDeals = (
  searchTerm: string,
  statusFilter: string | null,
  page: number,
  pageSize: number
) => {
  return useQuery({
    queryKey: ['adminDeals', searchTerm, statusFilter, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('deals')
        .select(`
          id,
          client_id,
          product_name,
          total_amount,
          advance_payment,
          remaining_amount,
          installment_months,
          monthly_installment,
          start_date,
          status,
          created_at,
          clients!inner (
            user_id,
            cnic,
            profiles!inner (
              name,
              email,
              phone
            )
          ),
          installments (
            id,
            due_date,
            amount,
            status
          ),
          payments (
            id,
            amount,
            payment_date,
            status
          )
        `, { count: 'exact' });

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`product_name.ilike.%${searchTerm}%`);
        // Note: For searching client names through deals, we might do client side filter or multiple queries.
        // For now, product_name search works via standard or().
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: (data as unknown) as AdminDeal[],
        count: count || 0,
      };
    }
  });
};
