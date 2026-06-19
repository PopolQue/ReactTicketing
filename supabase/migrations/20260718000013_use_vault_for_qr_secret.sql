CREATE TABLE IF NOT EXISTS public.app_secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Ensure the table is completely private
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

-- Insert the secret we generated
INSERT INTO public.app_secrets (name, value) 
VALUES ('qr_secret', 'd8b5c92c813a48bf9f1a2e8c257b4c9a') 
ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value;

-- Update the HMAC function to use the new table instead of postgres settings
CREATE OR REPLACE FUNCTION public.generate_ticket_hmac(
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
