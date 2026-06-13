-- 20260623000008_fix_remote_linter_natively.sql

-- 1. Ensure private schema exists
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Fix mutable search paths
ALTER FUNCTION public.trg_set_ticket_qr_payload() SET search_path = '';
ALTER FUNCTION public.cleanup_expired_promos() SET search_path = '';
ALTER FUNCTION public.trg_enforce_price_cap() SET search_path = '';
ALTER FUNCTION public.check_ticket_resellable() SET search_path = '';

-- 3. Revoke unintended access for triggers and cron jobs
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_promos() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_enforce_price_cap() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_set_ticket_qr_payload() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_ticket_resellable() FROM PUBLIC, anon, authenticated;

-- 4. Move API functions to private schema
-- Drop existing private functions from earlier migrations to avoid conflicts
DROP FUNCTION IF EXISTS private.buy_resale_ticket(UUID, UUID);
DROP FUNCTION IF EXISTS private.promote_admin_by_email(TEXT);

ALTER FUNCTION public.buy_resale_ticket(UUID, UUID) SET SCHEMA private;
ALTER FUNCTION public.generate_ticket_hmac(TEXT, TEXT) SET SCHEMA private;
ALTER FUNCTION public.get_artist_analytics(UUID) SET SCHEMA private;
ALTER FUNCTION public.increment_promo_usage(TEXT) SET SCHEMA private;
ALTER FUNCTION public.promote_admin_by_email(TEXT) SET SCHEMA private;
ALTER FUNCTION public.validate_ticket(TEXT, TEXT, TEXT, TIMESTAMPTZ) SET SCHEMA private;

-- 5. Secure the private functions natively
-- Revoke direct access and enforce search_path to clear warnings on the private schema functions
REVOKE EXECUTE ON FUNCTION private.buy_resale_ticket(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.generate_ticket_hmac(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.get_artist_analytics(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.increment_promo_usage(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.promote_admin_by_email(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.validate_ticket(TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon;

ALTER FUNCTION private.buy_resale_ticket(UUID, UUID) SET search_path = '';
ALTER FUNCTION private.generate_ticket_hmac(TEXT, TEXT) SET search_path = '';
ALTER FUNCTION private.get_artist_analytics(UUID) SET search_path = '';
ALTER FUNCTION private.increment_promo_usage(TEXT) SET search_path = '';
ALTER FUNCTION private.promote_admin_by_email(TEXT) SET search_path = '';
ALTER FUNCTION private.validate_ticket(TEXT, TEXT, TEXT, TIMESTAMPTZ) SET search_path = '';

-- 6. Create Public SECURITY INVOKER Wrappers

-- buy_resale_ticket
CREATE OR REPLACE FUNCTION public.buy_resale_ticket(p_listing_id UUID, p_buyer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN private.buy_resale_ticket(p_listing_id, p_buyer_id);
END;
$$;

-- generate_ticket_hmac
CREATE OR REPLACE FUNCTION public.generate_ticket_hmac(p_event_id TEXT, p_ticket_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN private.generate_ticket_hmac(p_event_id, p_ticket_id);
END;
$$;

-- get_artist_analytics
CREATE OR REPLACE FUNCTION public.get_artist_analytics(artist_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN private.get_artist_analytics(artist_id_param);
END;
$$;

-- increment_promo_usage
CREATE OR REPLACE FUNCTION public.increment_promo_usage(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    PERFORM private.increment_promo_usage(p_code);
END;
$$;

-- promote_admin_by_email
CREATE OR REPLACE FUNCTION public.promote_admin_by_email(target_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN private.promote_admin_by_email(target_email);
END;
$$;

-- validate_ticket
CREATE OR REPLACE FUNCTION public.validate_ticket(
  p_ticket_id       TEXT,
  p_scan_account_id TEXT,
  p_session_token   TEXT,
  p_scanned_at      TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN private.validate_ticket(p_ticket_id, p_scan_account_id, p_session_token, p_scanned_at);
END;
$$;
