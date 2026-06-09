-- Notification triggers for Deal creation and Payment receipt

-- Trigger for Deal creation
CREATE OR REPLACE FUNCTION public.notify_deal_created()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_admin_id UUID;
BEGIN
  -- Get user_id for the client
  SELECT user_id INTO v_user_id
  FROM public.clients
  WHERE id = NEW.client_id;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      v_user_id,
      'New Deal Created',
      'A new deal for ' || NEW.product_name || ' has been created with a total amount of $' || NEW.total_amount
    );
  END IF;

  -- Notify all admins
  FOR v_admin_id IN SELECT id FROM public.profiles WHERE role = 'ADMIN' LOOP
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      v_admin_id,
      'New Deal Created',
      'A new deal for ' || NEW.product_name || ' has been created.'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deal_created ON public.deals;
CREATE TRIGGER on_deal_created
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_deal_created();


-- Trigger for Payment received
CREATE OR REPLACE FUNCTION public.notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_product_name VARCHAR;
  v_admin_id UUID;
BEGIN
  IF NEW.status = 'PAID' AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'PAID')) THEN
    -- Get user_id and product name for the deal
    SELECT c.user_id, d.product_name INTO v_user_id, v_product_name
    FROM public.deals d
    JOIN public.clients c ON c.id = d.client_id
    WHERE d.id = NEW.deal_id;

    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (
        v_user_id,
        'Payment Received',
        'We have received a payment of $' || NEW.amount || ' for ' || v_product_name
      );
    END IF;

    -- Notify all admins
    FOR v_admin_id IN SELECT id FROM public.profiles WHERE role = 'ADMIN' LOOP
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (
        v_admin_id,
        'Payment Received',
        'A payment of $' || NEW.amount || ' for ' || v_product_name || ' has been received.'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_payment_received ON public.payments;
CREATE TRIGGER on_payment_received
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_payment_received();


-- For upcoming and overdue installments
CREATE OR REPLACE FUNCTION public.notify_installment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_product_name VARCHAR;
  v_admin_id UUID;
BEGIN
  IF NEW.status != OLD.status THEN
    SELECT c.user_id, d.product_name INTO v_user_id, v_product_name
    FROM public.deals d
    JOIN public.clients c ON c.id = d.client_id
    WHERE d.id = NEW.deal_id;

    IF v_user_id IS NOT NULL THEN
      IF NEW.status = 'OVERDUE' THEN
        INSERT INTO public.notifications (user_id, title, message)
        VALUES (v_user_id, 'Installment Overdue', 'Your installment of $' || NEW.amount || ' for ' || v_product_name || ' is overdue.');
        
        -- Admin notification for OVERDUE
        FOR v_admin_id IN SELECT id FROM public.profiles WHERE role = 'ADMIN' LOOP
          INSERT INTO public.notifications (user_id, title, message)
          VALUES (
            v_admin_id,
            'Installment Overdue',
            'An installment of $' || NEW.amount || ' for ' || v_product_name || ' is overdue.'
          );
        END LOOP;

      ELSIF NEW.status = 'PENDING' AND OLD.status != 'PENDING' THEN
        INSERT INTO public.notifications (user_id, title, message)
        VALUES (v_user_id, 'Upcoming Installment', 'You have an upcoming installment of $' || NEW.amount || ' for ' || v_product_name || ' due on ' || NEW.due_date);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_installment_status ON public.installments;
CREATE TRIGGER on_installment_status
  AFTER UPDATE ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_installment_status();
