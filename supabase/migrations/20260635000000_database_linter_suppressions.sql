-- 1. Explicitly revoke from 'authenticated' for internal cron/trigger functions
REVOKE EXECUTE ON FUNCTION public.process_resale_phase_shifts() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_support_email() FROM authenticated;

-- 2. Suppress the linter warning for the functions that are intentionally called by 'authenticated' users
COMMENT ON FUNCTION public.claim_invite(text) IS '@supabase-linter-ignore 0029_authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.create_checkout_transaction(jsonb, jsonb) IS '@supabase-linter-ignore 0029_authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.revoke_invite(uuid) IS '@supabase-linter-ignore 0029_authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.generate_ticket_hmac(text, text) IS '@supabase-linter-ignore 0029_authenticated_security_definer_function_executable';

