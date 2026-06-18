ALTER TABLE public.user_profiles ADD COLUMN is_claim_blocked BOOLEAN DEFAULT false;

-- Allow Admins to update user_profiles for blocking purposes
CREATE POLICY "Admins can update user_profiles" ON public.user_profiles 
FOR UPDATE 
USING (
    private.is_superadmin() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    private.is_superadmin() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
