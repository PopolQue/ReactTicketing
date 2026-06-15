DROP FUNCTION IF EXISTS public.claim_invite(text) CASCADE;
DROP FUNCTION IF EXISTS public.create_checkout_transaction(jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.generate_ticket_hmac(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.revoke_invite(uuid) CASCADE;

ALTER FUNCTION private.claim_invite(text) SET SCHEMA public;
ALTER FUNCTION private.create_checkout_transaction(jsonb, jsonb) SET SCHEMA public;
ALTER FUNCTION private.generate_ticket_hmac(text, text) SET SCHEMA public;
ALTER FUNCTION private.revoke_invite(uuid) SET SCHEMA public;
