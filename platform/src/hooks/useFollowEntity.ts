import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

export function useFollowEntity(entityId: string, entityType: 'artist' | 'venue' | 'organizer') {
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;

    async function fetchFollowState() {
      const { data: { user } } = await supabase.auth.getUser();

      // Get total count (using exact head count)
      const { count, error: countError } = await supabase
        .from('entity_followers')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (!countError && count !== null) {
        setFollowerCount(count);
      }

      // Check if current user is following
      if (user) {
        const { data } = await supabase
          .from('entity_followers')
          .select('id')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .eq('user_id', user.id)
          .single();
        
        if (data) setIsFollowing(true);
      }
      
      setLoading(false);
    }

    fetchFollowState();
  }, [entityId, entityType]);

  const toggleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('Please log in to follow this ' + entityType, 'error');
      return;
    }

    setLoading(true);

    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from('entity_followers')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', user.id);

      if (!error) {
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        showToast('Unfollowed', 'success');
      } else {
        showToast('Error unfollowing', 'error');
      }
    } else {
      // Follow
      const { error } = await supabase
        .from('entity_followers')
        .insert([{
          entity_type: entityType,
          entity_id: entityId,
          user_id: user.id
        }]);

      if (!error) {
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        showToast('Following!', 'success');
      } else {
        // If unique constraint violation, they already follow
        if (error.code === '23505') {
          setIsFollowing(true);
        } else {
          showToast('Error following', 'error');
        }
      }
    }
    
    setLoading(false);
  };

  return { isFollowing, followerCount, toggleFollow, loading };
}
