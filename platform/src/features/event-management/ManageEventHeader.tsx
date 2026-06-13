import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function ManageEventHeader({ event, eventId, updateEvent, subscriptionTier, tiersCount }: { event: any, eventId: string, updateEvent: any, subscriptionTier: string, tiersCount: number }) {
  const { showToast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);

  const togglePublish = async () => {
    setIsPublishing(true);
    if (!event.published && !event.is_external && tiersCount === 0) {
      showToast("You must add at least one ticket tier before publishing.", 'error');
      setIsPublishing(false);
      return;
    }

    const { error } = await supabase.from('events').update({ published: !event.published }).eq('id', eventId);
    if (!error) updateEvent({ published: !event.published });
    setIsPublishing(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div>
        <Link to="/organizer/events" className="btn-nav" style={{ padding: '8px 0', color: 'var(--text-secondary)', display: 'inline-block', marginBottom: '8px' }}>← Back to Events</Link>
        <h2 style={{ margin: 0 }}>Manage: {event?.name}</h2>
        <span style={{ fontSize: '0.8rem', backgroundColor: subscriptionTier === 'pro' ? '#8b5cf6' : '#4b5563', padding: '2px 8px', borderRadius: '12px', marginTop: '8px', display: 'inline-block' }}>
          {subscriptionTier.toUpperCase()} PLAN
        </span>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <a href={`/events/${eventId}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ textDecoration: 'none' }}>Preview Event Page</a>
        <button onClick={togglePublish} disabled={isPublishing} className="btn-primary" style={{ backgroundColor: event?.published ? '#10b981' : 'var(--accent)' }}>
          {isPublishing ? 'Updating...' : (event?.published ? '✓ Published (Live)' : 'Publish Event')}
        </button>
      </div>
    </div>
  );
}
