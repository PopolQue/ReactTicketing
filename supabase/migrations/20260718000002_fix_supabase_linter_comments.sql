-- Migration: Fix Supabase Linter Comments
-- Re-applies the correct Supabase linter suppression syntax.
-- My previous migration overwrote the correct '@supabase-linter-ignore 0029_...' syntax 
-- with an incorrect '@supabase-linter-disable' syntax. This restores them.

COMMENT ON FUNCTION public.approve_entity_claim(uuid) IS '@supabase-linter-ignore 0029_authenticated_security_definer_function_executable';

COMMENT ON FUNCTION public.claim_invite(text) IS '@supabase-linter-ignore 0029_authenticated_security_definer_function_executable';

COMMENT ON FUNCTION public.revoke_invite(uuid) IS '@supabase-linter-ignore 0029_authenticated_security_definer_function_executable';
