-- Insert default users into auth.users using a safe DO block for local/testing.
-- Passwords are set explicitly.
DO $$
DECLARE
  v_admin_uid UUID := '00000000-0000-0000-0000-000000000001';
  v_client_uid UUID := '00000000-0000-0000-0000-000000000002';
  
  v_other_uid1 UUID := '00000000-0000-0000-0000-100000000001';
  v_other_uid2 UUID := '00000000-0000-0000-0000-100000000002';
  v_other_uid3 UUID := '00000000-0000-0000-0000-100000000003';
  v_other_uid4 UUID := '00000000-0000-0000-0000-100000000004';
  
  v_client_1 UUID;
  v_client_2 UUID;
  v_client_3 UUID;
  v_client_4 UUID;
  v_client_5 UUID;

  v_deal_1 UUID;
  v_deal_2 UUID;
  v_deal_3 UUID;
  v_deal_4 UUID;
  v_deal_5 UUID;
  v_deal_6 UUID;
  v_deal_7 UUID;
  v_deal_8 UUID;
  v_deal_9 UUID;
  v_deal_10 UUID;
BEGIN
  -- 1. Create auth users
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token) 
  VALUES 
    (v_admin_uid, '00000000-0000-0000-0000-000000000000', 'admin@test.com', crypt('Admin@123456', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "System Admin", "role": "ADMIN"}', now(), now(), 'authenticated', 'authenticated', ''),
    (v_client_uid, '00000000-0000-0000-0000-000000000000', 'client@test.com', crypt('Client@123456', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Test Client", "role": "CLIENT"}', now(), now(), 'authenticated', 'authenticated', ''),
    (v_other_uid1, '00000000-0000-0000-0000-000000000000', 'client1@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Alice Smith", "role": "CLIENT"}', now(), now(), 'authenticated', 'authenticated', ''),
    (v_other_uid2, '00000000-0000-0000-0000-000000000000', 'client2@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Bob Jones", "role": "CLIENT"}', now(), now(), 'authenticated', 'authenticated', ''),
    (v_other_uid3, '00000000-0000-0000-0000-000000000000', 'client3@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Carol White", "role": "CLIENT"}', now(), now(), 'authenticated', 'authenticated', ''),
    (v_other_uid4, '00000000-0000-0000-0000-000000000000', 'client4@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Dave Brown", "role": "CLIENT"}', now(), now(), 'authenticated', 'authenticated', '')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Wait or update profiles (trigger usually creates them)
  UPDATE public.profiles SET role = 'ADMIN', name = 'System Admin', email = 'admin@test.com' WHERE id = v_admin_uid;
  UPDATE public.profiles SET role = 'CLIENT', name = 'Test Client', email = 'client@test.com' WHERE id = v_client_uid;
  UPDATE public.profiles SET role = 'CLIENT', name = 'Alice Smith', email = 'client1@test.com' WHERE id = v_other_uid1;
  UPDATE public.profiles SET role = 'CLIENT', name = 'Bob Jones', email = 'client2@test.com' WHERE id = v_other_uid2;
  UPDATE public.profiles SET role = 'CLIENT', name = 'Carol White', email = 'client3@test.com' WHERE id = v_other_uid3;
  UPDATE public.profiles SET role = 'CLIENT', name = 'Dave Brown', email = 'client4@test.com' WHERE id = v_other_uid4;

  -- 3. Create Clients
  INSERT INTO public.clients (user_id, address, cnic) VALUES 
    (v_client_uid, '123 Main St', '12345-1234567-1') RETURNING id INTO v_client_1;
  INSERT INTO public.clients (user_id, address, cnic) VALUES 
    (v_other_uid1, '456 Oak Ave', '12345-1234567-2') RETURNING id INTO v_client_2;
  INSERT INTO public.clients (user_id, address, cnic) VALUES 
    (v_other_uid2, '789 Pine Rd', '12345-1234567-3') RETURNING id INTO v_client_3;
  INSERT INTO public.clients (user_id, address, cnic) VALUES 
    (v_other_uid3, '101 Maple Blvd', '12345-1234567-4') RETURNING id INTO v_client_4;
  INSERT INTO public.clients (user_id, address, cnic) VALUES 
    (v_other_uid4, '202 Elm St', '12345-1234567-5') RETURNING id INTO v_client_5;

  -- 4. Create 10 Deals
  INSERT INTO public.deals (client_id, product_name, total_amount, advance_payment, remaining_amount, installment_months, monthly_installment, start_date) VALUES 
    (v_client_1, 'MacBook Pro M3', 2500.00, 500.00, 2000.00, 10, 200.00, CURRENT_DATE - interval '3 months') RETURNING id INTO v_deal_1;
  INSERT INTO public.deals (client_id, product_name, total_amount, advance_payment, remaining_amount, installment_months, monthly_installment, start_date) VALUES 
    (v_client_1, 'iPhone 15 Pro Max', 1200.00, 200.00, 1000.00, 10, 100.00, CURRENT_DATE - interval '1 month') RETURNING id INTO v_deal_2;
  INSERT INTO public.deals (client_id, product_name, total_amount, advance_payment, remaining_amount, installment_months, monthly_installment, start_date) VALUES 
    (v_client_2, 'Sony A7IV Camera', 2800.00, 800.00, 2000.00, 5, 400.00, CURRENT_DATE - interval '2 months') RETURNING id INTO v_deal_3;
  INSERT INTO public.deals (client_id, product_name, total_amount, advance_payment, remaining_amount, installment_months, monthly_installment, start_date) VALUES 
    (v_client_2, 'DJI Mavic 3 Cine', 5000.00, 1000.00, 4000.00, 10, 400.00, CURRENT_DATE - interval '4 months') RETURNING id INTO v_deal_4;
  INSERT INTO public.deals (client_id, product_name, total_amount, advance_payment, remaining_amount, installment_months, monthly_installment, start_date) VALUES 
    (v_client_3, 'Samsung S24 Ultra', 1400.00, 400.00, 1000.00, 5, 200.00, CURRENT_DATE - interval '1 month') RETURNING id INTO v_deal_5;
  INSERT INTO public.deals (client_id, product_name, total_amount, advance_payment, remaining_amount, installment_months, monthly_installment, start_date) VALUES 
    (v_client_3, 'Gaming PC Build', 3000.00, 1000.00, 2000.00, 10, 200.00, CURRENT_DATE - interval '6 months') RETURNING id INTO v_deal_6;
  INSERT INTO public.deals (client_id, product_name, total_amount, advance_payment, remaining_amount, installment_months, monthly_installment, start_date) VALUES 
    (v_client_4, 'Honda CD 70 Dream', 2000.00, 500.00, 1500.00, 12, 125.00, CURRENT_DATE - interval '2 months') RETURNING id INTO v_deal_7;
  INSERT INTO public.deals (client_id, product_name, total_amount, advance_payment, remaining_amount, installment_months, monthly_installment, start_date) VALUES 
    (v_client_4, 'Suzuki Alto VXR', 15000.00, 5000.00, 10000.00, 24, 416.67, CURRENT_DATE - interval '12 months') RETURNING id INTO v_deal_8;
  INSERT INTO public.deals (client_id, product_name, total_amount, advance_payment, remaining_amount, installment_months, monthly_installment, start_date) VALUES 
    (v_client_5, 'Dell XPS 15', 2200.00, 200.00, 2000.00, 8, 250.00, CURRENT_DATE - interval '1 month') RETURNING id INTO v_deal_9;
  INSERT INTO public.deals (client_id, product_name, total_amount, advance_payment, remaining_amount, installment_months, monthly_installment, start_date, status) VALUES 
    (v_client_5, 'Apple Watch Series 9', 600.00, 100.00, 500.00, 5, 100.00, CURRENT_DATE - interval '6 months', 'COMPLETED') RETURNING id INTO v_deal_10;

  -- 5. Create 20 Payments
  INSERT INTO public.payments (deal_id, amount, payment_date, status) VALUES
    (v_deal_1, 200.00, CURRENT_DATE - interval '2 months', 'PAID'),
    (v_deal_1, 200.00, CURRENT_DATE - interval '1 month', 'PAID'),
    (v_deal_2, 100.00, CURRENT_DATE - interval '1 month', 'PAID'),
    (v_deal_3, 400.00, CURRENT_DATE - interval '1 month', 'PAID'),
    (v_deal_4, 400.00, CURRENT_DATE - interval '3 months', 'PAID'),
    (v_deal_4, 400.00, CURRENT_DATE - interval '2 months', 'PAID'),
    (v_deal_4, 400.00, CURRENT_DATE - interval '1 month', 'PAID'),
    (v_deal_5, 200.00, CURRENT_DATE - interval '15 days', 'PAID'),
    (v_deal_6, 200.00, CURRENT_DATE - interval '5 months', 'PAID'),
    (v_deal_6, 200.00, CURRENT_DATE - interval '4 months', 'PAID'),
    (v_deal_6, 200.00, CURRENT_DATE - interval '3 months', 'PAID'),
    (v_deal_6, 200.00, CURRENT_DATE - interval '2 months', 'PAID'),
    (v_deal_6, 200.00, CURRENT_DATE - interval '1 month', 'PAID'),
    (v_deal_7, 125.00, CURRENT_DATE - interval '1 month', 'PAID'),
    (v_deal_8, 416.67, CURRENT_DATE - interval '11 months', 'PAID'),
    (v_deal_8, 416.67, CURRENT_DATE - interval '10 months', 'PAID'),
    (v_deal_8, 416.67, CURRENT_DATE - interval '9 months', 'PAID'),
    (v_deal_9, 250.00, CURRENT_DATE - interval '15 days', 'PAID'),
    (v_deal_10, 500.00, CURRENT_DATE - interval '1 month', 'PAID'),
    (v_deal_10, 100.00, CURRENT_DATE - interval '5 months', 'PAID');

  -- 6. Create Notifications
  INSERT INTO public.notifications (user_id, title, message) VALUES
    (v_client_uid, 'Welcome', 'Welcome to Installment Pro!'),
    (v_client_uid, 'Payment Received', 'We have received your payment of $200.00.'),
    (v_client_uid, 'New Deal', 'Your deal for MacBook Pro M3 is active.'),
    (v_admin_uid, 'System Alert', 'Database backup completed.'),
    (v_admin_uid, 'New Client', 'A new client Alice Smith has registered.');

  -- 7. Create Audit Logs
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data) VALUES
    (v_admin_uid, 'INSERT', 'clients', v_client_1, '{"cnic": "12345-1234567-1"}'),
    (v_admin_uid, 'INSERT', 'deals', v_deal_1, '{"amount": "2500"}'),
    (v_admin_uid, 'UPDATE', 'deals', v_deal_10, '{"status": "COMPLETED"}');

END $$;
