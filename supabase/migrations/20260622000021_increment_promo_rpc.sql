-- supabase/migrations/20260622000021_increment_promo_rpc.sql

-- supabase-lint-ignore authenticated_security_definer_function_executable
CREATE OR REPLACE FUNCTION increment_promo_usage(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE promo_codes
  SET used_count = used_count + 1
  WHERE code = p_code
    AND active = TRUE
    AND (max_uses IS NULL OR used_count < max_uses)
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'promo_code_exhausted_or_invalid';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_promo_usage FROM public;
REVOKE EXECUTE ON FUNCTION increment_promo_usage FROM anon;
GRANT EXECUTE ON FUNCTION increment_promo_usage TO authenticated;
