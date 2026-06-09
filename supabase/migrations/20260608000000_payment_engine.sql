-- 1. Create RPC for secure, atomic payment recording
CREATE OR REPLACE FUNCTION public.record_payment(
  p_deal_id UUID,
  p_amount NUMERIC,
  p_payment_date DATE,
  p_receipt_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_deal public.deals%ROWTYPE;
  v_payment_id UUID;
BEGIN
  -- Obtain row-level lock on the deal to prevent race conditions
  SELECT * INTO v_deal
  FROM public.deals
  WHERE id = p_deal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;

  IF v_deal.status = 'COMPLETED' THEN
    RAISE EXCEPTION 'Deal is already completed';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  -- The absolute max they can pay is their remaining amount
  IF p_amount > v_deal.remaining_amount THEN
    RAISE EXCEPTION 'Payment amount cannot exceed remaining balance';
  END IF;

  -- Insert payment as PAID. 
  -- Our existing trigger `on_payment_status_changed` handles the deal balance decrement automatically.
  INSERT INTO public.payments (deal_id, amount, payment_date, status, receipt_url)
  VALUES (p_deal_id, p_amount, p_payment_date, 'PAID', p_receipt_url)
  RETURNING id INTO v_payment_id;

  -- Re-query to return updated balance
  SELECT * INTO v_deal FROM public.deals WHERE id = p_deal_id;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'remaining_amount', v_deal.remaining_amount,
    'status', v_deal.status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Update Storage Bucket size and policies
-- Assuming bucket 'receipts' exists from earlier migrations
UPDATE storage.buckets
SET file_size_limit = 10485760 -- 10MB
WHERE id = 'receipts';

-- Revoke client upload rights, restrict ONLY to Admins
DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;

CREATE POLICY "Admins can upload receipts" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'receipts' AND 
    public.is_admin()
  );

CREATE POLICY "Admins can delete receipts" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'receipts' AND 
    public.is_admin()
  );
