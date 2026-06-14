import { useState, useEffect, useCallback } from 'react';
import { supabaseAdapter } from '../lib/supabase';
import { generateInviteToken, buildInviteUrl } from '../lib/invites/token';

export function useInviteManager(scope: "all" | "artist", organizerId?: string) {
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (scope === "artist") {
        filters.entityType = "artist";
      }
      const data = await supabaseAdapter.listInvites(filters);
      setInvites(data);
    } catch (err) {
      console.error("Failed to load invites", err);
    } finally {
      setIsLoading(false);
    }
  }, [scope, organizerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (options: any) => {
    const { rawToken, tokenHash } = await generateInviteToken();
    const userRes = await supabaseAdapter['supabase'].auth.getUser(); // access raw supabase
    const invite = {
      token_hash: tokenHash,
      entity_type: options.entityType,
      entity_id: options.entityId,
      entity_name: options.entityName,
      role: options.role,
      created_by_user_id: userRes.data.user?.id,
      invitee_email: options.inviteeEmail,
      max_uses: options.maxUses || 1,
      note: options.note,
      prefill: options.prefill
    };

    const newInvite = await supabaseAdapter.createInvite(invite);
    await refresh();
    return { invite: newInvite, rawUrl: buildInviteUrl(rawToken) };
  };

  const revoke = async (inviteId: string) => {
    await supabaseAdapter.revokeInvite(inviteId);
    await refresh();
  };

  return { invites, isLoading, create, revoke, refresh };
}
