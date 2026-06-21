import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import Modal from './Modal';
import { useToast } from './Toast';

export const AddFriendModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const searchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('public_profiles')
      .select('id, username')
      .ilike('username', `%${searchTerm}%`)
      .limit(10);

    if (error) {
      showToast('Error searching users: ' + error.message, 'error');
    } else {
      setResults(data || []);
    }
    setLoading(false);
  };

  const sendRequest = async (friendId: string) => {
    if (sendingId) return; // Prevent double submission
    setSendingId(friendId);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSendingId(null);
      return;
    }

    const { error } = await supabase
      .from('friendships')
      .insert([{ user_id: user.id, friend_id: friendId, status: 'pending' }]);

    if (error) {
      showToast('Error sending request: ' + error.message, 'error');
    } else {
      showToast('Friend request sent!', 'success');
    }
    setSendingId(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Friend">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          className="input-field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by username..."
        />
        <button className="btn-primary" onClick={searchUsers}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {results.map((user) => (
          <div
            key={user.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span>{user.username}</span>
            <button
              className="btn-secondary"
              disabled={sendingId === user.id}
              onClick={() => sendRequest(user.id)}
            >
              {sendingId === user.id ? 'Sending...' : 'Add'}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
};
