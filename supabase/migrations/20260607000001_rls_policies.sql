-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles: Users can view their own profile. Admins can view all.
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
-- Note: 'role' escalation is protected by a trigger, not just RLS.

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());
  
-- Clients: Clients can see their own client record. Admins can see/manage all.
CREATE POLICY "Users can view own client record" ON public.clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all clients" ON public.clients
  FOR ALL USING (public.is_admin());

-- Deals: Clients view their deals. Admins manage all deals.
CREATE POLICY "Users can view own deals" ON public.deals
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all deals" ON public.deals
  FOR ALL USING (public.is_admin());

-- Installments
CREATE POLICY "Users can view own installments" ON public.installments
  FOR SELECT USING (
    deal_id IN (
      SELECT id FROM public.deals WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage installments" ON public.installments
  FOR ALL USING (public.is_admin());

-- Payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    deal_id IN (
      SELECT id FROM public.deals WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  );

-- Clients can only insert PENDING payments
CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (
    deal_id IN (
      SELECT id FROM public.deals WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    ) AND status = 'PENDING'
  );

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (public.is_admin());

-- Receipts
CREATE POLICY "Users can view own receipts" ON public.receipts
  FOR SELECT USING (
    payment_id IN (
      SELECT p.id FROM public.payments p
      JOIN public.deals d ON p.deal_id = d.id
      JOIN public.clients c ON d.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Clients can insert receipts for their own payments
CREATE POLICY "Users can insert own receipts" ON public.receipts
  FOR INSERT WITH CHECK (
    payment_id IN (
      SELECT p.id FROM public.payments p
      JOIN public.deals d ON p.deal_id = d.id
      JOIN public.clients c ON d.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage receipts" ON public.receipts
  FOR ALL USING (public.is_admin());

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (public.is_admin());

-- Audit Logs (Admins only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- Insertions handled by triggers running as superuser, no manual inserts allowed.
