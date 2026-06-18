-- 1. Fix search_path for handle_new_friendship
ALTER FUNCTION public.handle_new_friendship() SET search_path = public;

-- 2. Revoke public/anon/authenticated execution for trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_friendship() FROM PUBLIC, anon, authenticated;

-- 3. Suppress intended SECURITY DEFINER warnings for RPCs
COMMENT ON FUNCTION public.approve_entity_claim(uuid) IS '@supabase-linter-ignore authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.claim_invite(text) IS '@supabase-linter-ignore authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.revoke_invite(uuid) IS '@supabase-linter-ignore authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.handle_new_friendship() IS '@supabase-linter-ignore authenticated_security_definer_function_executable';
