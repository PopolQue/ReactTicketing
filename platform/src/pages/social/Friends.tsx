import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddFriendModal } from '../../components/AddFriendModal';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import { AvatarPlaceholder } from '../../components/AvatarPlaceholder';
import { useLanguage } from '../../contexts/LanguageContext';

interface FriendProfile {
  id: string;
  username: string;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  profile1?: FriendProfile;
  profile2?: FriendProfile;
}

interface Request {
  id: string;
  profile?: { username: string };
}

export default function Friends() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [friends, setFriends] = useState<{ id: string; userId: string; username: string }[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetchRequests();
    fetchFriends();

    const channel = supabase
      .channel('friendships_channel')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchRequests() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('friendships')
      .select(
        `
                id,
                profile:user_profiles!friendships_user_id_profiles_fkey (username)
            `
      )
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    setRequests((data as unknown as Request[]) || []);
  }

  async function fetchFriends() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('friendships')
      .select(
        `
                id,
                user_id,
                friend_id,
                profile1:user_profiles!friendships_user_id_profiles_fkey (id, username),
                profile2:user_profiles!friendships_friend_id_profiles_fkey (id, username)
            `
      )
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (data) {
      const friendsList = (data as unknown as Friendship[]).map((f) => {
        if (f.user_id === user.id)
          return { id: f.id, userId: f.profile2?.id || '', username: f.profile2?.username || '' };
        return { id: f.id, userId: f.profile1?.id || '', username: f.profile1?.username || '' };
      });
      setFriends(friendsList);
    }
  }

  const updateRequest = async (id: string, status: 'accepted' | 'blocked') => {
    const { error } = await supabase.from('friendships').update({ status }).eq('id', id);

    if (error) {
      showToast('Error updating request: ' + error.message, 'error');
    } else {
      showToast(`Request ${status}!`, 'success');
      setRequests((prev) => prev.filter((req) => req.id !== id));
      if (status === 'accepted') fetchFriends();
    }
  };

  const unfriend = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase.from('friendships').delete().eq('id', id);

    if (error) {
      showToast('Error removing friend: ' + error.message, 'error');
    } else {
      showToast('Friend removed', 'success');
      setFriends((prev) => prev.filter((f) => f.id !== id));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Friends</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          +
        </button>
      </div>

      <h2>Pending Requests</h2>
      {requests.map((req) => (
        <div key={req.id} style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
          <span>{req.profile?.username} wants to be friends</span>
          <button onClick={() => updateRequest(req.id, 'accepted')}>Accept</button>
          <button onClick={() => updateRequest(req.id, 'blocked')}>Reject</button>
        </div>
      ))}

      <h2>Friends List</h2>
      {friends.map((f) => (
        <div
          key={f.id}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}
        >
          <button
            onClick={() => navigate(`/profile/${f.userId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            <AvatarPlaceholder size={32} />
            <span>{f.username}</span>
          </button>
          <button
            onClick={(e) => unfriend(e, f.id)}
            className="btn-secondary"
            style={{ padding: '8px 12px', borderColor: '#ef4444', color: '#ef4444' }}
          >
            {t('nav.unfriend') || 'Unfriend'}
          </button>
        </div>
      ))}

      <AddFriendModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchRequests();
        }}
      />
    </div>
  );
}
