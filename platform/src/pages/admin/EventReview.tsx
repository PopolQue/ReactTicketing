import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function EventReview() {
  const { showToast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    // Fetch events that organizers have "published" but still need approval
    const { data } = await supabase
      .from('events')
      .select('*, organizers(name)')
      .eq('published', true)
      .eq('approval_status', 'pending')
      .order('start_date', { ascending: true });
    
    if (data) setEvents(data);
    setLoading(false);
  }

  const handleAction = async (eventId: string, action: 'approved' | 'rejected') => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('events')
      .update({ 
        approval_status: action,
        reviewed_by: user?.id
      })
      .eq('id', eventId);

    if (error) {
      showToast('Error updating event status.', 'error');
    } else {
      showToast(`Event ${action} successfully.`, 'success');
      fetchEvents();
    }
  };

  if (loading) return <div>Loading queue...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Event Review Queue</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        These events have been published by organizers and are waiting for your approval to appear on the marketplace.
      </p>

      {events.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Hooray! The queue is empty.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {events.map(event => (
            <div key={event.id} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0 }}>{event.name}</h3>
                  {event.is_external && <span style={{ fontSize: '0.7rem', backgroundColor: '#6366f1', padding: '2px 6px', borderRadius: '4px' }}>EXTERNAL</span>}
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                  Organizer: {event.organizers?.name || 'Unknown'} | Date: {new Date(event.start_date).toLocaleString()}
                </p>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{event.description}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', minWidth: '200px', justifyContent: 'flex-end' }}>
                <a href={`/events/${event.id}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px 16px', textDecoration: 'none' }}>
                  Preview
                </a>
                <button 
                  onClick={() => handleAction(event.id, 'rejected')} 
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleAction(event.id, 'approved')} 
                  className="btn-primary" 
                  style={{ padding: '8px 16px', backgroundColor: '#10b981' }}
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
