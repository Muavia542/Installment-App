import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AdminClient {
  id: string;
  user_id: string;
  address: string | null;
  cnic: string | null;
  created_at: string;
  profiles: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
  deals: { id: string; status: string }[];
}

export const useAdminClients = (
  searchTerm: string, 
  page: number, 
  pageSize: number
) => {
  return useQuery({
    queryKey: ['adminClients', searchTerm, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          id,
          user_id,
          address,
          cnic,
          created_at,
          profiles${searchTerm ? '!inner' : ''} (
            name,
            email,
            phone
          ),
          deals (
            id,
            status
          )
        `, { count: 'exact' });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`, { foreignTable: 'profiles' });
      }

      // We'll pull a bit more if we do client side search, but let's try pagination on DB level first.
      // Let's drop DB search for 'profiles' for a sec to avoid complex postgrest syntax and just fetch and filter 
      // if it's a small dataset, but for production, we do standard pagination.
      
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Type asserting the nested associations since Postgrest returns them as arrays or objects
      return {
        data: (data as unknown) as AdminClient[],
        count: count || 0,
      };
    }
  });
};
