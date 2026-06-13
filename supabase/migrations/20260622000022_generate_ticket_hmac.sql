-- supabase/migrations/20260622000022_generate_ticket_hmac.sql

-- First, ensure pgcrypto is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Function to generate the new HMAC format TF1.<eventId>.<ticketId>.<hmac>
CREATE OR REPLACE FUNCTION generate_ticket_hmac(
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
  -- Attempt to get the secret from vault if vault extension is installed and available.
  -- For local environments or testing where vault isn't set up, fallback to a dummy secret
  -- or fetch from an event_settings table if applicable.
  -- In a real setup, it would be:
  -- SELECT secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'scan_session_secret_' || p_event_id;
  
  -- Dummy fallback for now to ensure it works without vault:
  v_secret := 'dummy_secret_' || p_event_id;

  v_payload := 'TF1.' || p_event_id || '.' || p_ticket_id;
  v_hmac := hmac(v_payload::bytea, v_secret::bytea, 'sha256');
  
  -- Convert to base64, replace + with -, / with _ (URL safe base64 without padding)
  v_hmac_base64 := encode(v_hmac, 'base64');
  v_hmac_base64 := replace(replace(replace(v_hmac_base64, '+', '-'), '/', '_'), '=', '');

  RETURN v_payload || '.' || v_hmac_base64;
END;
$$;

REVOKE EXECUTE ON FUNCTION generate_ticket_hmac FROM public;
REVOKE EXECUTE ON FUNCTION generate_ticket_hmac FROM anon;
GRANT EXECUTE ON FUNCTION generate_ticket_hmac TO authenticated;

-- Trigger to automatically assign qr_payload on insert if not provided
CREATE OR REPLACE FUNCTION trg_set_ticket_qr_payload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.qr_payload IS NULL THEN
    NEW.qr_payload := generate_ticket_hmac(NEW.event_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_ticket_qr_payload
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION trg_set_ticket_qr_payload();
