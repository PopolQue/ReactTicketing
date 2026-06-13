-- 20260623000009_fix_wrapper_search_paths.sql

-- The Supabase linter requires `search_path` to be explicitly set even on 
-- SECURITY INVOKER functions if they are exposed in the public API schema.

ALTER FUNCTION public.buy_resale_ticket(UUID, UUID) SET search_path = '';
ALTER FUNCTION public.generate_ticket_hmac(TEXT, TEXT) SET search_path = '';
ALTER FUNCTION public.get_artist_analytics(UUID) SET search_path = '';
ALTER FUNCTION public.increment_promo_usage(TEXT) SET search_path = '';
ALTER FUNCTION public.promote_admin_by_email(TEXT) SET search_path = '';
ALTER FUNCTION public.validate_ticket(TEXT, TEXT, TEXT, TIMESTAMPTZ) SET search_path = '';
