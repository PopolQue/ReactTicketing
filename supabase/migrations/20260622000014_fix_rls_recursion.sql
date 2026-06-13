-- Fix infinite recursion on user_roles

DROP POLICY IF EXISTS "Admins can read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage roles" ON public.user_roles;

-- Allow all authenticated users to read roles
CREATE POLICY "Authenticated users can read roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create a security definer function to check for superadmin status securely without recursing
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Superadmins can manage roles using the security definer function
CREATE POLICY "Superadmins can manage roles" 
ON public.user_roles 
USING (public.is_superadmin());
