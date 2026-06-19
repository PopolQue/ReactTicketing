-- Server-side scan session token verification + QR payload verification
-- These use secrets from app_secrets table, never exposed to client.

-- Verify a QR payload's HMAC signature
CREATE OR REPLACE FUNCTION verify_qr_payload(
  p_qr_payload TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
  v_parts TEXT[];
  v_prefix TEXT;
  v_event_id TEXT;
  v_raw_ticket TEXT;
  v_signature TEXT;
  v_data TEXT;
  v_expected_sig TEXT;
BEGIN
  v_parts := string_to_array(p_qr_payload, '.');
  IF array_length(v_parts, 1) != 4 THEN
    RETURN FALSE;
  END IF;

  v_prefix := v_parts[1];
  v_event_id := v_parts[2];
  v_raw_ticket := v_parts[3];
  v_signature := v_parts[4];

  IF v_prefix NOT IN ('TF1', 'ADM1') THEN
    RETURN FALSE;
  END IF;

  -- The HMAC covers prefix.eventId.ticketId (timestamp suffix is after | and not signed)
  SELECT split_part(v_raw_ticket, '|', 1) INTO v_raw_ticket;
  v_data := v_prefix || '.' || v_event_id || '.' || v_raw_ticket;

  -- Get secret from app_secrets first, fall back to postgres setting
  SELECT value INTO v_secret FROM public.app_secrets WHERE name = 'qr_secret';
  IF v_secret IS NULL THEN
    BEGIN
      v_secret := current_setting('app.settings.qr_secret', true);
    EXCEPTION WHEN OTHERS THEN
      RETURN FALSE;
    END;
  END IF;

  IF v_secret IS NULL OR v_secret = '' THEN
    RETURN FALSE;
  END IF;

  v_expected_sig := encode(hmac(v_data::bytea, v_secret::bytea, 'sha256'), 'base64');
  v_expected_sig := replace(replace(replace(v_expected_sig, '+', '-'), '/', '_'), '=', '');

  RETURN v_expected_sig = v_signature;
END;
$$;

-- Verify a scan session token's HMAC and return decoded payload
CREATE OR REPLACE FUNCTION verify_scan_token(
  p_token TEXT,
  p_expected_event_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
  v_parts TEXT[];
  v_header_b64 TEXT;
  v_payload_b64 TEXT;
  v_signature_b64 TEXT;
  v_data TEXT;
  v_expected_sig TEXT;
  v_payload JSONB;
  v_sub TEXT;
  v_evt TEXT;
  v_exp BIGINT;
  v_iat BIGINT;
  v_ver INT;
  v_account RECORD;
BEGIN
  v_parts := string_to_array(p_token, '.');
  IF array_length(v_parts, 1) != 3 THEN
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'malformed_token');
  END IF;

  v_header_b64 := v_parts[1];
  v_payload_b64 := v_parts[2];
  v_signature_b64 := v_parts[3];

  v_data := v_header_b64 || '.' || v_payload_b64;

  -- Get secret
  SELECT value INTO v_secret FROM public.app_secrets WHERE name = 'scan_session_secret';
  IF v_secret IS NULL THEN
    BEGIN
      v_secret := current_setting('app.settings.scan_session_secret', true);
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('valid', FALSE, 'reason', 'secret_not_configured');
    END;
  END IF;

  IF v_secret IS NULL OR v_secret = '' THEN
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'secret_not_configured');
  END IF;

  -- Compare HMAC
  v_expected_sig := encode(hmac(v_data::bytea, v_secret::bytea, 'sha256'), 'base64');
  v_expected_sig := replace(replace(replace(v_expected_sig, '+', '-'), '/', '_'), '=', '');

  IF v_expected_sig != v_signature_b64 THEN
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'invalid_signature');
  END IF;

  -- Decode payload
  v_payload := convert_from(decode(v_payload_b64, 'base64'), 'UTF-8')::jsonb;

  v_sub := v_payload->>'sub';
  v_evt := v_payload->>'evt';
  v_exp := (v_payload->>'exp')::bigint;
  v_iat := (v_payload->>'iat')::bigint;
  v_ver := (v_payload->>'ver')::int;

  -- Check expiry
  IF v_exp < (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint THEN
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'token_expired');
  END IF;

  -- Check event match
  IF v_evt != p_expected_event_id THEN
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'event_mismatch');
  END IF;

  -- Check account still active and credential version matches
  SELECT * INTO v_account FROM scan_accounts WHERE id = v_sub;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'account_not_found');
  END IF;
  IF v_account.active = FALSE THEN
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'account_inactive');
  END IF;
  IF v_account.credential_version != v_ver THEN
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'credential_stale');
  END IF;

  RETURN jsonb_build_object(
    'valid', TRUE,
    'account_id', v_sub,
    'account_username', v_payload->>'usr',
    'event_id', v_evt,
    'credential_version', v_ver,
    'assigned_location', v_account.assigned_location,
    'issued_at', v_iat,
    'expires_at', v_exp
  );
END;
$$;

-- Sign a scan session token
CREATE OR REPLACE FUNCTION sign_scan_token(
  p_payload JSONB
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
  v_header_b64 TEXT;
  v_payload_b64 TEXT;
  v_data TEXT;
  v_signature TEXT;
  v_full_token TEXT;
BEGIN
  SELECT value INTO v_secret FROM public.app_secrets WHERE name = 'scan_session_secret';
  IF v_secret IS NULL THEN
    BEGIN
      v_secret := current_setting('app.settings.scan_session_secret', true);
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'scan_session_secret not configured';
    END;
  END IF;

  v_header_b64 := encode('{"alg":"HS256","typ":"JWT"}'::bytea, 'base64');
  v_header_b64 := replace(replace(replace(v_header_b64, '+', '-'), '/', '_'), '=', '');
  v_payload_b64 := encode(convert_to(p_payload::text, 'UTF-8'), 'base64');
  v_payload_b64 := replace(replace(replace(v_payload_b64, '+', '-'), '/', '_'), '=', '');

  v_data := v_header_b64 || '.' || v_payload_b64;
  v_signature := encode(hmac(v_data::bytea, v_secret::bytea, 'sha256'), 'base64');
  v_signature := replace(replace(replace(v_signature, '+', '-'), '/', '_'), '=', '');

  v_full_token := v_data || '.' || v_signature;
  RETURN v_full_token;
END;
$$;

-- Revoke execute from public/anonymous, grant to authenticated
REVOKE EXECUTE ON FUNCTION verify_qr_payload FROM public, anon;
REVOKE EXECUTE ON FUNCTION verify_scan_token FROM public, anon;
REVOKE EXECUTE ON FUNCTION sign_scan_token FROM public, anon;
GRANT EXECUTE ON FUNCTION verify_qr_payload TO authenticated;
GRANT EXECUTE ON FUNCTION verify_scan_token TO authenticated;
GRANT EXECUTE ON FUNCTION sign_scan_token TO authenticated;
