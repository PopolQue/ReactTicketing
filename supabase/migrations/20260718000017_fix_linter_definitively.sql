-- Fix: Move SECURITY DEFINER logic entirely to private schema
-- And create SECURITY INVOKER wrappers in the public schema
-- This permanently resolves the linter warnings without relying on flaky comments.

-- 1. Move approve_entity_claim to private
ALTER FUNCTION public.approve_entity_claim(uuid) SET SCHEMA private;

-- Grant access to authenticated
GRANT EXECUTE ON FUNCTION private.approve_entity_claim(uuid) TO authenticated;

-- Create public wrapper
CREATE OR REPLACE FUNCTION public.approve_entity_claim(p_claim_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN private.approve_entity_claim(p_claim_id);
END;
$$;

-- 2. Move claim_invite to private (if it isn't already)
-- Actually, let's just make SURE the public ones are wrappers!
-- But wait! If public.claim_invite contains the real logic right now, we need to move it to private!
-- What if private.claim_invite ALREADY exists? 
-- If it exists, public.claim_invite is ALREADY just a wrapper!
-- Let's just drop and recreate the public wrappers as SECURITY INVOKER.
-- Wait, if public.claim_invite had the REAL logic, dropping it loses the logic!
-- In my previous search, supabase_schema_dump.sql showed public.claim_invite HAD THE REAL LOGIC.
-- Let's move public -> private, but first drop the old private ones to avoid name collisions.

DROP FUNCTION IF EXISTS private.claim_invite(text);
ALTER FUNCTION public.claim_invite(text) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.claim_invite(text) TO authenticated;

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

-- 3. Revoke invite
DROP FUNCTION IF EXISTS private.revoke_invite(uuid);
ALTER FUNCTION public.revoke_invite(uuid) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.revoke_invite(uuid) TO authenticated;

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

-- 4. Generate Ticket HMAC
-- My previous migration created public.generate_ticket_hmac as SECURITY DEFINER with REAL logic.
DROP FUNCTION IF EXISTS private.generate_ticket_hmac(text, text);
ALTER FUNCTION public.generate_ticket_hmac(text, text) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.generate_ticket_hmac(text, text) TO authenticated;

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

-- Ensure all public wrappers are executable by authenticated
GRANT EXECUTE ON FUNCTION public.approve_entity_claim(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_ticket_hmac(text, text) TO authenticated;

-- Revoke from anon/public
REVOKE EXECUTE ON FUNCTION public.approve_entity_claim(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_invite(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_invite(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_ticket_hmac(text, text) FROM anon, PUBLIC;
