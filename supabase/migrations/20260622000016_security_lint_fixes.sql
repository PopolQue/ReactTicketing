-- 1. Fix function_search_path_mutable warnings
ALTER FUNCTION public.buy_resale_ticket(UUID, UUID) SET search_path = '';
ALTER FUNCTION public.promote_admin_by_email(TEXT) SET search_path = '';


-- 3. Fix SECURITY DEFINER warnings for is_superadmin()
-- We move it to a private schema so it is not exposed by PostgREST as an RPC endpoint.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

-- Drop policies that depend on the public function
DROP POLICY IF EXISTS "Superadmins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all claims" ON public.artist_claims;
DROP POLICY IF EXISTS "Admins can update claims" ON public.artist_claims;

-- Move the function and secure its search path
ALTER FUNCTION public.is_superadmin() SET search_path = '';
ALTER FUNCTION public.is_superadmin() SET SCHEMA private;

-- Recreate the policies using the new private schema function
CREATE POLICY "Superadmins can manage roles" 
ON public.user_roles 
USING (private.is_superadmin());

CREATE POLICY "Admins can view all claims" ON public.artist_claims FOR SELECT USING (
    private.is_superadmin() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update claims" ON public.artist_claims FOR UPDATE USING (
    private.is_superadmin() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
