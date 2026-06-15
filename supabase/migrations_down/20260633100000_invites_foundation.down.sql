DROP FUNCTION IF EXISTS public.validate_invite(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.claim_invite(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.revoke_invite(UUID) CASCADE;
DROP TABLE IF EXISTS public.invite_link_claims CASCADE;
DROP TABLE IF EXISTS public.invite_audit_events CASCADE;
DROP TABLE IF EXISTS public.invite_links CASCADE;
DROP TABLE IF EXISTS public.artist_members CASCADE;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
