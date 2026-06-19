-- Suppress 'rls_enabled_no_policy' warnings for tables that are intentionally private.
-- These tables are designed to have a "deny all" default state and are only accessed 
-- via SECURITY DEFINER functions or the service_role key.

COMMENT ON TABLE public.app_secrets IS '@supabase-linter-ignore rls_enabled_no_policy';
COMMENT ON TABLE public.invite_link_claims IS '@supabase-linter-ignore rls_enabled_no_policy';
COMMENT ON TABLE public.promo_code_ticket_types IS '@supabase-linter-ignore rls_enabled_no_policy';
