export type Role = 'ADMIN' | 'CLIENT';

export interface Profile {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string | null;
  created_at: string;
}

export interface ClientData {
  id: string;
  user_id: string;
  address?: string | null;
  cnic?: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Deal {
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
  client?: ClientData;
}

export interface Payment {
  id: string;
  deal_id: string;
  amount: number;
  payment_date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  receipt_url?: string | null;
  created_at: string;
  deal?: Deal;
}
