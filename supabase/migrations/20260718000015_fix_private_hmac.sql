-- Replace the private.generate_ticket_hmac function which might still be getting called
CREATE OR REPLACE FUNCTION private.generate_ticket_hmac(
  p_event_id TEXT,
  p_ticket_id TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret TEXT;
  v_payload TEXT;
  v_hmac BYTEA;
  v_hmac_base64 TEXT;
BEGIN
  -- Read from our secure secrets table
  SELECT value INTO v_secret FROM public.app_secrets WHERE name = 'qr_secret';

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'QR signing secret is not configured in public.app_secrets';
  END IF;

  v_payload := 'TF1.' || p_event_id || '.' || p_ticket_id;
  v_hmac := hmac(v_payload::bytea, v_secret::bytea, 'sha256');
  
  v_hmac_base64 := encode(v_hmac, 'base64');
  v_hmac_base64 := replace(replace(replace(v_hmac_base64, '+', '-'), '/', '_'), '=', '');

  RETURN v_payload || '.' || v_hmac_base64;
END;
$$;
