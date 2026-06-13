-- Migration to fix Supabase Linter Warnings

-- 1. FIX: Function Search Path Mutable
-- Supabase requires SECURITY DEFINER functions to have a strict search_path to prevent search path injection attacks.
ALTER FUNCTION public.trg_set_ticket_qr_payload() SET search_path = '';
ALTER FUNCTION public.cleanup_expired_promos() SET search_path = '';
ALTER FUNCTION public.trg_enforce_price_cap() SET search_path = '';
ALTER FUNCTION public.check_ticket_resellable() SET search_path = '';

-- 2. FIX: Public / Anon Can Execute SECURITY DEFINER Function
-- By default, PostgreSQL grants EXECUTE to PUBLIC on new functions. We must explicitly revoke it
-- so unauthenticated users (anon) cannot trigger these sensitive functions via the REST API.
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_promos() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_promos() FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_artist_analytics(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_artist_analytics(uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.trg_enforce_price_cap() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_enforce_price_cap() FROM anon;

REVOKE EXECUTE ON FUNCTION public.trg_set_ticket_qr_payload() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_set_ticket_qr_payload() FROM anon;

-- 3. FIX: Signed-In Users Can Execute SECURITY DEFINER Function (Triggers & Internal Jobs)
-- Triggers and pg_cron jobs should not be executable manually by authenticated users either.
REVOKE EXECUTE ON FUNCTION public.trg_enforce_price_cap() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_set_ticket_qr_payload() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_promos() FROM authenticated;

-- NOTE ON INTENTIONAL AUTHENTICATED SECURITY DEFINER WARNINGS:
-- The linter will still flag functions like `buy_resale_ticket`, `get_artist_analytics`,
-- `generate_ticket_hmac`, `increment_promo_usage`, `promote_admin_by_email`, and `validate_ticket`.
-- This is INTENTIONAL. These functions require SECURITY DEFINER to bypass strict RLS 
-- (e.g., to transfer a ticket owner or increment usage counts) but MUST be callable 
-- by authenticated users. You can safely ignore those specific warnings in the Supabase Dashboard.
