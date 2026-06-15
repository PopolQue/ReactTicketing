ALTER FUNCTION private.is_superadmin() SET SCHEMA public;
ALTER FUNCTION public.is_superadmin() SET search_path = public;

DROP POLICY IF EXISTS "Superadmins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all claims" ON public.artist_claims;
DROP POLICY IF EXISTS "Admins can update claims" ON public.artist_claims;

CREATE POLICY "Superadmins can manage roles" ON public.user_roles USING (public.is_superadmin());
CREATE POLICY "Admins can view all claims" ON public.artist_claims FOR SELECT USING (
    public.is_superadmin() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update claims" ON public.artist_claims FOR UPDATE USING (
    public.is_superadmin() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

ALTER FUNCTION public.buy_resale_ticket(UUID, UUID) RESET search_path;
ALTER FUNCTION public.promote_admin_by_email(TEXT) RESET search_path;
