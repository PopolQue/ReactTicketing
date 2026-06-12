import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function EventsList() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyEvents() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .order('start_date', { ascending: false });
        
      if (data) setEvents(data);
      setLoading(false);
    }
    fetchMyEvents();
  }, []);

  return (
    <div className="events-list-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>My Events</h2>
        <Link to="/organizer/events/new">
          <button className="btn-primary">+ Create Event</button>
        </Link>
      </div>
      
      {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading your events...</p> : (
        <div className="events-grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
          {events.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>You haven't created any events yet.</p>
          ) : (
            events.map(event => (
              <div key={event.id} className="event-card glass-panel" style={{ padding: '20px', borderLeft: event.published ? '4px solid #10b981' : '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>{event.name}</h3>
                  <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: event.published ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: event.published ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {event.published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                  {new Date(event.start_date).toLocaleDateString()} • {event.venue}{event.city ? `, ${event.city}` : ''}{event.country ? `, ${event.country}` : ''}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link to={`/organizer/events/${event.id}`} style={{ width: '100%' }}>
                    <button className="btn-secondary" style={{ width: '100%' }}>Manage & Publish</button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
