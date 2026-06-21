import React, { useState } from 'react';
import { useToast } from './Toast';
import { supabase } from '../lib/supabase';

export const PostEventForm = ({ eventId, onPosted }: { eventId: string; onPosted: () => void }) => {
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handlePost = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('posts').insert([
      {
        user_id: user.id,
        event_id: eventId,
        is_public: isPublic,
      },
    ]);

    if (error) {
      showToast('Failed to post', 'error');
    } else {
      showToast('Posted to timeline!', 'success');
      onPosted();
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
      <label>
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        Make this post public
      </label>
      <button
        className="btn-primary"
        onClick={handlePost}
        disabled={loading}
        style={{ marginLeft: '10px' }}
      >
        {loading ? 'Posting...' : 'Post Attendance'}
      </button>
    </div>
  );
};
