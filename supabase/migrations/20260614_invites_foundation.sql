-- Drop previous attempt tables
DROP TABLE IF EXISTS public.invite_link_claims CASCADE;
DROP TABLE IF EXISTS public.invite_audit_events CASCADE;
DROP TABLE IF EXISTS public.invite_links CASCADE;
DROP TABLE IF EXISTS public.artist_members CASCADE;

-- 1. Expand user_roles constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('fan', 'organizer', 'admin', 'superadmin', 'artist_member', 'venue_manager', 'writer'));

-- 2. Create artist_members junction table
CREATE TABLE public.artist_members (
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (artist_id, user_id)
);

ALTER TABLE public.artist_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artist_members_read_own" ON public.artist_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admins_read_artist_members" ON public.artist_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','superadmin'))
);

-- Migrating existing artist owners to artist_members table
INSERT INTO public.artist_members (artist_id, user_id, role)
SELECT id, claimed_by_user_id, 'owner'
FROM public.artists
WHERE claimed_by_user_id IS NOT NULL;

-- 3. Create invite_links table
CREATE TABLE public.invite_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('organizer','artist','venue')),
    entity_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    invitee_email TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
    max_uses INTEGER NOT NULL DEFAULT 1,
    use_count INTEGER NOT NULL DEFAULT 0,
    prefill JSONB,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by_user_id UUID REFERENCES auth.users(id),
    CONSTRAINT invite_use_count_check CHECK (use_count <= max_uses)
);

CREATE INDEX invite_links_token_hash_idx ON public.invite_links (token_hash);
CREATE INDEX invite_links_entity_idx ON public.invite_links (entity_type, entity_id);
CREATE INDEX invite_links_status_idx ON public.invite_links (status);
CREATE INDEX invite_links_created_by_idx ON public.invite_links (created_by_user_id);

ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_all_invites" ON public.invite_links FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "admins_create_invites" ON public.invite_links FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "organizers_read_own_invites" ON public.invite_links FOR SELECT USING (created_by_user_id = auth.uid());
CREATE POLICY "organizers_create_artist_invites" ON public.invite_links FOR INSERT WITH CHECK (
    entity_type = 'artist' AND created_by_user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.organizers WHERE claimed_by_user_id = auth.uid())
);

-- 4. Create invite_audit_events table
CREATE TABLE public.invite_audit_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invite_id UUID NOT NULL REFERENCES public.invite_links(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created','viewed','accepted','revoked','expired')),
    actor_user_id UUID REFERENCES auth.users(id),
    actor_ip INET,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX invite_audit_invite_idx ON public.invite_audit_events (invite_id);
ALTER TABLE public.invite_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_audit_events" ON public.invite_audit_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- 5. Create invite_link_claims junction table (for double-claim checking)
CREATE TABLE public.invite_link_claims (
    invite_id UUID NOT NULL REFERENCES public.invite_links(id) ON DELETE CASCADE,
    accepted_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (invite_id, accepted_by_user_id)
);
ALTER TABLE public.invite_link_claims ENABLE ROW LEVEL SECURITY;

-- 6. RPC: validate_invite
CREATE OR REPLACE FUNCTION public.validate_invite(p_token_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_invite invite_links%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM invite_links WHERE token_hash = p_token_hash;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF v_invite.expires_at < NOW() AND v_invite.status = 'pending' THEN
    UPDATE invite_links SET status = 'expired', updated_at = NOW() WHERE id = v_invite.id;
    INSERT INTO invite_audit_events (invite_id, action) VALUES (v_invite.id, 'expired');
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  IF v_invite.status = 'revoked' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
  END IF;

  IF v_invite.status = 'accepted' OR v_invite.use_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'exhausted');
  END IF;

  IF v_invite.status = 'expired' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  INSERT INTO invite_audit_events (invite_id, action, actor_user_id) VALUES (v_invite.id, 'viewed', auth.uid());

  RETURN jsonb_build_object(
    'valid', true,
    'entityType', v_invite.entity_type,
    'entityName', v_invite.entity_name,
    'entityId', v_invite.entity_id,
    'inviteeEmail', v_invite.invitee_email,
    'prefill', v_invite.prefill,
    'expiresAt', v_invite.expires_at,
    'usesRemaining', v_invite.max_uses - v_invite.use_count
  );
END;
$$;

-- 7. RPC: claim_invite
CREATE OR REPLACE FUNCTION public.claim_invite(p_raw_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_hash TEXT;
  v_invite invite_links%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'claim_invite requires an authenticated session';
  END IF;

  v_token_hash := encode(digest(p_raw_token, 'sha256'), 'hex');

  SELECT * INTO v_invite FROM invite_links WHERE token_hash = v_token_hash FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_invite.status NOT IN ('pending') OR v_invite.use_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_claimable', 'status', v_invite.status);
  END IF;

  IF v_invite.expires_at < NOW() THEN
    UPDATE invite_links SET status = 'expired', updated_at = NOW() WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;

  IF EXISTS (SELECT 1 FROM invite_link_claims WHERE invite_id = v_invite.id AND accepted_by_user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  IF v_invite.entity_type = 'organizer' THEN
    UPDATE public.organizers SET claimed_by_user_id = v_user_id WHERE id = v_invite.entity_id::UUID;
  ELSIF v_invite.entity_type = 'artist' THEN
    INSERT INTO public.artist_members (artist_id, user_id, role)
    VALUES (v_invite.entity_id::UUID, v_user_id, 'member')
    ON CONFLICT (artist_id, user_id) DO NOTHING;
  ELSIF v_invite.entity_type = 'venue' THEN
    UPDATE public.venues SET claimed_by_user_id = v_user_id WHERE id = v_invite.entity_id::UUID;
  END IF;

  INSERT INTO user_roles (user_id, role) VALUES (v_user_id, v_invite.role) ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE invite_links
  SET use_count = use_count + 1,
      status = CASE WHEN use_count + 1 >= max_uses THEN 'accepted' ELSE status END,
      updated_at = NOW()
  WHERE id = v_invite.id;

  INSERT INTO invite_link_claims (invite_id, accepted_by_user_id) VALUES (v_invite.id, v_user_id);
  INSERT INTO invite_audit_events (invite_id, action, actor_user_id) VALUES (v_invite.id, 'accepted', v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'entityType', v_invite.entity_type,
    'entityId', v_invite.entity_id,
    'role', v_invite.role
  );
END;
$$;

-- 8. RPC: revoke_invite
CREATE OR REPLACE FUNCTION public.revoke_invite(p_invite_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','superadmin')) 
     AND NOT EXISTS (SELECT 1 FROM invite_links WHERE id = p_invite_id AND created_by_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Insufficient permissions to revoke this invite';
  END IF;

  UPDATE invite_links
  SET status = 'revoked', revoked_at = NOW(), revoked_by_user_id = auth.uid(), updated_at = NOW()
  WHERE id = p_invite_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or not in pending status';
  END IF;

  INSERT INTO invite_audit_events (invite_id, action, actor_user_id) VALUES (p_invite_id, 'revoked', auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_invite(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_invite(UUID) TO authenticated;
