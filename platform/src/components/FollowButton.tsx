import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FollowButtonProps {
  entityId: string;
  entityType: 'artist' | 'organizer' | 'venue' | 'event';
  className?: string;
  style?: React.CSSProperties;
  showCount?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  entityId,
  entityType,
  className,
  style,
  showCount = true,
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [entityId, entityType]);

  const checkFollowStatus = async () => {
    // Get total count
    const { count } = await supabase
      .from('entity_followers')
      .select('id', { count: 'exact', head: true })
      .eq('entity_id', entityId)
      .eq('entity_type', entityType);

    setFollowerCount(count || 0);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('entity_followers')
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_id', entityId)
      .eq('entity_type', entityType);

    setIsFollowing(!!data && data.length > 0);
    setLoading(false);
  };

  const toggleFollow = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return; // Handle login redirect

    setLoading(true);
    console.log('Follow payload:', {
      user_id: user.id,
      entity_id: entityId,
      entity_type: entityType,
    });
    if (isFollowing) {
      const { error } = await supabase
        .from('entity_followers')
        .delete()
        .eq('user_id', user.id)
        .eq('entity_id', entityId)
        .eq('entity_type', entityType);

      if (error) console.error('Delete error:', error);
      else {
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
      }
    } else {
      const { error } = await supabase
        .from('entity_followers')
        .insert({ user_id: user.id, entity_id: entityId, entity_type: entityType });

      if (error) console.error('Insert error:', error);
      else {
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    }
    setLoading(false);
  };

  if (loading)
    return (
      <button disabled className={className} style={style}>
        Loading...
      </button>
    );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {showCount && <span>{followerCount}</span>}
      <button
        onClick={toggleFollow}
        className={className || (isFollowing ? 'btn-secondary' : 'btn-primary')}
        style={style}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
};
