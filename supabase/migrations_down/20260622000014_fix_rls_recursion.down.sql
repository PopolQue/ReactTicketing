DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage roles" ON public.user_roles;
DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;

CREATE POLICY "Superadmins can manage roles" ON public.user_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'superadmin'
        )
    );

CREATE POLICY "Admins can read roles" ON public.user_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );
