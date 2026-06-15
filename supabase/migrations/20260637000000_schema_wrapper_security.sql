-- 1. Setup private schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Drop existing private functions if they collide, because we are moving the latest public ones there
DROP FUNCTION IF EXISTS private.claim_invite(text);
DROP FUNCTION IF EXISTS private.create_checkout_transaction(jsonb, jsonb);
DROP FUNCTION IF EXISTS private.generate_ticket_hmac(text, text);
DROP FUNCTION IF EXISTS private.revoke_invite(uuid);

-- 2. Move sensitive functions to private schema
ALTER FUNCTION public.claim_invite(text) SET SCHEMA private;
ALTER FUNCTION public.create_checkout_transaction(jsonb, jsonb) SET SCHEMA private;
ALTER FUNCTION public.generate_ticket_hmac(text, text) SET SCHEMA private;
ALTER FUNCTION public.revoke_invite(uuid) SET SCHEMA private;

-- 3. Ensure authenticated can execute the private functions
GRANT EXECUTE ON FUNCTION private.claim_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.create_checkout_transaction(jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION private.generate_ticket_hmac(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.revoke_invite(uuid) TO authenticated;

-- 4. Create public SECURITY INVOKER wrappers
CREATE OR REPLACE FUNCTION public.claim_invite(p_raw_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN private.claim_invite(p_raw_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_checkout_transaction(p_order jsonb, p_tickets jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    PERFORM private.create_checkout_transaction(p_order, p_tickets);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_ticket_hmac(p_event_id text, p_ticket_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN private.generate_ticket_hmac(p_event_id, p_ticket_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    PERFORM private.revoke_invite(p_invite_id);
END;
$$;

-- 5. Grant explicit access to wrappers
GRANT EXECUTE ON FUNCTION public.claim_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkout_transaction(jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_ticket_hmac(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_invite(uuid) TO authenticated;

-- 6. Revoke access from public/anon
REVOKE EXECUTE ON FUNCTION public.claim_invite(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_checkout_transaction(jsonb, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_ticket_hmac(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_invite(uuid) FROM PUBLIC, anon;
