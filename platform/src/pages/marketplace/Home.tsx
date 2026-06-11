import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer_profiles ( company_name )
        `)
        .order('start_date', { ascending: true });
        
      if (!error && data) {
        setEvents(data);
      } else if (error) {
        console.error("Error fetching events:", error);
      }
      setLoading(false);
    }
    
    fetchEvents();
  }, []);

  return (
    <div className="marketplace-page" style={{ minHeight: '100vh' }}>
      <header style={{ padding: '24px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, letterSpacing: '-0.5px' }}>
          Ticketeer <span style={{ color: 'var(--accent)' }}>Marketplace</span>
        </h2>
        <nav style={{ display: 'flex', gap: '16px' }}>
          <Link to="/auth" className="btn-secondary" style={{ textDecoration: 'none' }}>Organizer Portal</Link>
        </nav>
      </header>

      <main style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '16px', fontWeight: 800, letterSpacing: '-1px' }}>Discover Your Next Experience</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>From underground club nights to massive festivals. Securely buy and resell tickets.</p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading live events...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
            {events.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>No events are live at the moment.</p>
                <p style={{ color: 'var(--text-secondary)' }}>Are you an organizer? <Link to="/auth" style={{ color: 'var(--accent)' }}>Create one now!</Link></p>
              </div>
            ) : (
              events.map((event) => (
                <Link to={`/events/${event.id}`} key={event.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="glass-panel event-card-hover" style={{ padding: '24px', height: '100%' }}>
                    <div style={{ height: '180px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <span style={{ fontSize: '3rem', opacity: 0.2 }}>🎟️</span>
                    </div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', lineHeight: '1.3' }}>{event.name}</h3>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {event.venue}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--accent)', fontWeight: 600 }}>
                      By {event.organizer_profiles?.company_name || 'Independent Organizer'}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
