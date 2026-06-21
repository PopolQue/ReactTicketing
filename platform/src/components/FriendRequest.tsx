import React, { useState } from 'react';
import { useToast } from './Toast';

export const FriendRequest = ({ onSend }: { onSend: (friendId: string) => Promise<void> }) => {
  const [friendId, setFriendId] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSend(friendId);
      showToast('Friend request sent!', 'success');
      setFriendId('');
    } catch (error) {
      showToast('Failed to send request', 'error');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
      <input
        className="input-field"
        value={friendId}
        onChange={(e) => setFriendId(e.target.value)}
        placeholder="Enter User ID"
        required
      />
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Sending...' : 'Add Friend'}
      </button>
    </form>
  );
};
