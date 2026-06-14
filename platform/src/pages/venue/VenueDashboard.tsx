import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Entity } from '../../components/EntitySwitcher';

export default function VenueDashboard() {
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchEvents() {
    setLoading(true);
    // Fetch all events booked at this venue
    const { data } = await supabase
      .from('events')
      .select('id, name, start_date, organizers(name)')
      .eq('venue_id', activeEntity.id)
      .order('start_date', { ascending: false });
      
    if (data) setEvents(data);
    setLoading(false);
  }

  useEffect(() => {
    if (activeEntity) {
      fetchEvents();
    }
  }, [activeEntity]);

  return (
    <div>
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px 0' }}>Welcome, {activeEntity.name}!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Below are the upcoming and past events booked at your venue.
        </p>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Event Schedule</h3>
      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No events have been booked at this venue yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {events.map((event) => (
            <div key={event.id} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{event.name}</h4>
                <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
                  Organizer: <strong style={{ color: 'white' }}>{event.organizers?.name}</strong>
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '4px' }}>
                  {new Date(event.start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {new Date(event.start_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
