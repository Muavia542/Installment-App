-- Create Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 5MB limit
  ('receipts', 'receipts', false, 20971520, ARRAY['image/jpeg', 'image/png', 'application/pdf']), -- 20MB limit
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']) -- 50MB limit
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Avatars
CREATE POLICY "Avatar images are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can update their own avatars" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );
  
CREATE POLICY "Users can delete their own avatars" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Storage Policies for Receipts
CREATE POLICY "Users can view their own receipts" 
  ON storage.objects FOR SELECT 
  USING (
    bucket_id = 'receipts' AND (
      auth.uid()::text = (string_to_array(name, '/'))[1] OR
      public.is_admin()
    )
  );

CREATE POLICY "Users can upload their own receipts" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'receipts' AND (
      auth.uid()::text = (string_to_array(name, '/'))[1] OR
      public.is_admin()
    )
  );

CREATE POLICY "Users can delete their own receipts" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'receipts' AND (
      auth.uid()::text = (string_to_array(name, '/'))[1] OR
      public.is_admin()
    )
  );

-- Storage Policies for Documents
CREATE POLICY "Admins can view all documents" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'documents' AND public.is_admin());

CREATE POLICY "Admins can upload documents" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'documents' AND public.is_admin());

CREATE POLICY "Admins can delete documents" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'documents' AND public.is_admin());
