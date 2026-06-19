-- Supabase linter does not support @supabase-linter-ignore for rls_enabled_no_policy.
-- The officially recommended way to silence this informational warning is to explicitly 
-- define a deny-all policy on the tables. This also improves self-documentation.

CREATE POLICY "deny_all" ON public.app_secrets
FOR ALL TO public USING (false) WITH CHECK (false);

CREATE POLICY "deny_all" ON public.invite_link_claims
FOR ALL TO public USING (false) WITH CHECK (false);

CREATE POLICY "deny_all" ON public.promo_code_ticket_types
FOR ALL TO public USING (false) WITH CHECK (false);
