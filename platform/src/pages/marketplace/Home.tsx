import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/Skeleton';

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) setUser(currentUser);

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer_profiles ( company_name )
        `)
        .eq('published', true)
        .order('start_date', { ascending: true })
        .limit(20);

      if (!error && data) {
        setEvents(data);
      } else if (error) {
        console.error("Error fetching events:", error);
      }
      setLoading(false);
    }

    fetchEvents();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Derive unique cities
  const uniqueCities = Array.from(new Set(events.map(e => e.city).filter(Boolean))) as string[];

  // Filter events based on search and selected city
  const filteredEvents = events.filter(e => {
    const matchesCity = selectedCity ? e.city === selectedCity : true;
    const matchesSearch = searchQuery === '' ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.city && e.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCity && matchesSearch;
  });

  return (
    <div className="marketplace-page" style={{ minHeight: '100vh' }}>
      <header style={{ padding: '24px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, letterSpacing: '-0.5px' }}>
          Admit <span style={{ color: 'var(--accent)' }}>Marketplace</span>
        </h2>
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/resale" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, marginRight: '16px' }}>Secondary Market</Link>
          {user ? (
            <>
              <Link to="/wallet" className="btn-secondary" style={{ textDecoration: 'none' }}>My Wallet</Link>
              <Link to="/organizer" className="btn-secondary" style={{ textDecoration: 'none' }}>Organizer Dashboard</Link>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Logout</button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary" style={{ textDecoration: 'none' }}>Log In / Sign Up</Link>
          )}
        </nav>
      </header>

      <main style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '16px', fontWeight: 800, letterSpacing: '-1px' }}>Discover Your Next Experience</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '32px' }}>From underground club nights to massive festivals. Securely buy and resell tickets.</p>

          {/* Search Bar */}
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex' }}>
            <input
              type="text"
              placeholder="Search by event name, city, or venue..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ flexGrow: 1, padding: '16px 24px', fontSize: '1.1rem', borderRadius: '30px', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.05)' }}
            />
          </div>
        </div>

        {/* Filters */}
        {!loading && uniqueCities.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px', justifyContent: 'center' }}>
            <button
              onClick={() => setSelectedCity(null)}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 500,
                backgroundColor: selectedCity === null ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                color: selectedCity === null ? 'white' : 'var(--text-primary)'
              }}
            >
              All Cities
            </button>
            {uniqueCities.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                style={{
                  padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 500,
                  backgroundColor: selectedCity === city ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  color: selectedCity === city ? 'white' : 'var(--text-primary)'
                }}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-panel" style={{ padding: '24px' }}>
                <Skeleton height="30px" width="80%" style={{ marginBottom: '12px' }} />
                <Skeleton height="20px" width="60%" style={{ marginBottom: '24px' }} />
                <Skeleton height="40px" width="100%" />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
            {filteredEvents.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>No events found matching your criteria.</p>
                <button onClick={() => { setSearchQuery(''); setSelectedCity(null); }} className="btn-secondary" style={{ marginTop: '16px' }}>Clear Filters</button>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <Link to={`/events/${event.id}`} key={event.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="glass-panel event-card-hover" style={{ padding: '24px', height: '100%' }}>
                    <div style={{ height: '180px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '3rem', opacity: 0.2 }}>🎟️</span>
                    </div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', lineHeight: '1.3' }}>{event.name}</h3>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {event.venue}{event.city ? `, ${event.city}` : ''}{event.country ? `, ${event.country}` : ''}
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
