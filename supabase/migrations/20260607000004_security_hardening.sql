-- 1. Ensure 1:1 mapping between Profile and Client for database integrity
ALTER TABLE public.clients ADD CONSTRAINT clients_user_id_key UNIQUE (user_id);

-- 2. Drop the auth.users trigger. 
-- The React frontend explicitly inserts into public.profiles after signup in login.tsx.
-- Leaving an auth trigger creates race conditions or duplicate key database errors.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Replace the profile update role protection with a comprehensive INSERT/UPDATE shield.
-- This GUARANTEES "No Fake Admin" bypasses. Even if a malicious frontend payload specifies
-- { role: 'ADMIN' } during signup, this Postegres trigger intercepts it at the engine level.
DROP TRIGGER IF EXISTS protect_role_update ON public.profiles;

CREATE OR REPLACE FUNCTION public.enforce_profile_security()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- First user in the database becomes ADMIN automatically (Safe Application Bootstrap)
    IF NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
      NEW.role := 'ADMIN';
    -- For all subsequent users, unless explicitly inserted BY an existing admin, FORCE CLIENT
    ELSIF NOT public.is_admin() THEN
      NEW.role := 'CLIENT';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only admins can change roles. A malicious user attempting to patch their role
    -- will have the attempt silently reverted to their existing role.
    IF NOT public.is_admin() AND NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_profile_role_security
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_security();

-- 4. Establish the Client Record automatically, tied to the Profile creation securely.
CREATE OR REPLACE FUNCTION public.auto_create_client_record()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'CLIENT' THEN
    INSERT INTO public.clients (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER profile_inserted_create_client
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_create_client_record();

-- 5. Add Missing RLS Policy for Clients updating their own details securely
CREATE POLICY "Users can update own client details" ON public.clients
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
