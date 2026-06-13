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
            events.map(event => {
              const getEventStatusText = () => {
                if (event.published) {
                  if (event.approval_status === 'approved') return 'Live';
                  if (event.approval_status === 'rejected') return 'Action Required';
                  return 'Pending Approval';
                }
                return 'Draft';
              };
              
              const getEventStatusColor = () => {
                if (event.published) {
                  if (event.approval_status === 'approved') return '#10b981';
                  if (event.approval_status === 'rejected') return '#ef4444';
                  return '#f59e0b';
                }
                return '#6b7280';
              };

              const statusColor = getEventStatusColor();

              return (
                <div key={event.id} className="event-card glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${statusColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 8px 0' }}>{event.name}</h3>
                    <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: `${statusColor}33`, color: statusColor, fontWeight: 600 }}>
                      {getEventStatusText()}
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
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
