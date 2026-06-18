import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchFeed();
  }, []);

  async function fetchFeed() {
    const { data, error } = await supabase.from('activity_feed').select('*');
    if (data) setPosts(data);
  }

  return (
    <div>
      <h3>Activity Feed</h3>
      {posts.map(post => (
        <div key={post.id} style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
          User {post.user_id} is going to event {post.event_id}
        </div>
      ))}
    </div>
  );
};
