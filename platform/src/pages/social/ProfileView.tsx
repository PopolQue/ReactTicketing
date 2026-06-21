import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function ProfileView() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [isFriend, setIsFriend] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if it's their own profile
      if (user.id === id) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('id, username')
          .eq('id', id)
          .single();
        setProfile(profileData);
        setIsFriend(true);
      } else {
        // 1. Check if they are friends
        const { data: friendship } = await supabase
          .from('friendships')
          .select('id')
          .or(
            `and(user_id.eq.${user.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${user.id})`
          )
          .eq('status', 'accepted')
          .maybeSingle();

        if (friendship) {
          setIsFriend(true);
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('id, username')
            .eq('id', id)
            .single();
          setProfile(profileData);
        } else {
          setIsFriend(false);
        }
      }
      setLoading(false);

      // Realtime listener for friendship changes
      const channel = supabase
        .channel('friendships_channel')
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'friendships',
          },
          (payload) => {
            // Check if the deleted friendship involves the current user and the profile owner
            const oldRecord = payload.old;
            if (
              (oldRecord.user_id === user.id && oldRecord.friend_id === id) ||
              (oldRecord.user_id === id && oldRecord.friend_id === user.id)
            ) {
              setIsFriend(false);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    checkAccess();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (isFriend === false) return <div>You must be friends to view this profile.</div>;
  if (!profile) return <div>Profile not found.</div>;

  return (
    <div className="glass-panel" style={{ padding: '32px' }}>
      <h1>{profile.username}'s Profile</h1>
      {/* Add profile details here */}
    </div>
  );
}
