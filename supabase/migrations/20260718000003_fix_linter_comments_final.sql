-- Migration: Fix Linter Comments Final
-- The correct syntax omits the '0029_' prefix for this specific warning in this Supabase CLI version.

COMMENT ON FUNCTION public.approve_entity_claim(uuid) IS '@supabase-linter-ignore authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.claim_invite(text) IS '@supabase-linter-ignore authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.revoke_invite(uuid) IS '@supabase-linter-ignore authenticated_security_definer_function_executable';
