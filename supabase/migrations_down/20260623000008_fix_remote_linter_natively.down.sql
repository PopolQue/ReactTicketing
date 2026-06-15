DROP FUNCTION IF EXISTS public.buy_resale_ticket(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.generate_ticket_hmac(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_artist_analytics(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_promo_usage(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.promote_admin_by_email(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.validate_ticket(TEXT, TEXT, TEXT, TIMESTAMPTZ) CASCADE;

ALTER FUNCTION private.buy_resale_ticket(UUID, UUID) SET SCHEMA public;
ALTER FUNCTION private.generate_ticket_hmac(TEXT, TEXT) SET SCHEMA public;
ALTER FUNCTION private.get_artist_analytics(UUID) SET SCHEMA public;
ALTER FUNCTION private.increment_promo_usage(TEXT) SET SCHEMA public;
ALTER FUNCTION private.promote_admin_by_email(TEXT) SET SCHEMA public;
ALTER FUNCTION private.validate_ticket(TEXT, TEXT, TEXT, TIMESTAMPTZ) SET SCHEMA public;

ALTER FUNCTION public.buy_resale_ticket(UUID, UUID) SET search_path = public;
ALTER FUNCTION public.generate_ticket_hmac(TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.get_artist_analytics(UUID) SET search_path = public;
ALTER FUNCTION public.increment_promo_usage(TEXT) SET search_path = public;
ALTER FUNCTION public.promote_admin_by_email(TEXT) SET search_path = public;
ALTER FUNCTION public.validate_ticket(TEXT, TEXT, TEXT, TIMESTAMPTZ) SET search_path = public;

GRANT EXECUTE ON FUNCTION public.buy_resale_ticket(UUID, UUID) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_ticket_hmac(TEXT, TEXT) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_artist_analytics(UUID) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_promo_usage(TEXT) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_admin_by_email(TEXT) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_ticket(TEXT, TEXT, TEXT, TIMESTAMPTZ) TO PUBLIC, anon, authenticated;
