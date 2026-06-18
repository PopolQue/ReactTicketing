CREATE POLICY "Blocked users cannot create claims" ON public.entity_claims
FOR INSERT
WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_claim_blocked = true)
);
