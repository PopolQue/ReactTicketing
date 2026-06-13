import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/Skeleton';
import EventCard from '../../components/EventCard';
import ArtistCard from '../../components/ArtistCard';
import VenueCard from '../../components/VenueCard';
import OrganizerCard from '../../components/OrganizerCard';

export default function Discover() {
  const [activeTab, setActiveTab] = useState<'events' | 'artists' | 'venues' | 'organizers'>('events');
  const [results, setResults] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<unknown>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) setUser(currentUser);
    }
    checkUser();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setResults([]);
      
      try {
        if (activeTab === 'events') {
          const { data } = await supabase
            .from('events')
            .select(`*, organizer_profiles ( company_name )`)
            .eq('published', true)
            .eq('approval_status', 'approved')
            .order('start_date', { ascending: true })
            .limit(50);
            
          if (data) setResults(data);
        } 
        else if (activeTab === 'artists') {
          const { data } = await supabase.from('artists').select('*').limit(50);
          if (data) setResults(data);
        }
        else if (activeTab === 'venues') {
          const { data } = await supabase.from('venues').select('*').order('is_verified', { ascending: false }).limit(50);
          if (data) setResults(data);
        }
        else if (activeTab === 'organizers') {
          const { data } = await supabase.from('organizers').select('*').limit(50);
          if (data) setResults(data);
        }
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Derive unique cities (only relevant for events and venues)
  const uniqueCities = Array.from(new Set(
    results.map(r => r.city).filter(Boolean)
  )) as string[];

  // Filter based on search and selected city
  const filteredResults = results.filter(item => {
    const matchesCity = selectedCity ? item.city === selectedCity : true;
    let matchesSearch = true;
    
    if (searchQuery !== '') {
      const q = searchQuery.toLowerCase();
      if (activeTab === 'events') {
        matchesSearch = item.name.toLowerCase().includes(q) || (item.city && item.city.toLowerCase().includes(q)) || (item.venue && item.venue.toLowerCase().includes(q));
      } else if (activeTab === 'artists') {
        matchesSearch = item.name.toLowerCase().includes(q) || (item.genres && item.genres.join(' ').toLowerCase().includes(q));
      } else if (activeTab === 'venues') {
        matchesSearch = item.name.toLowerCase().includes(q) || (item.city && item.city.toLowerCase().includes(q));
      } else if (activeTab === 'organizers') {
        matchesSearch = item.company_name?.toLowerCase().includes(q);
      }
    }

    return matchesCity && matchesSearch;
  });

  const getPlaceholder = () => {
    switch(activeTab) {
      case 'events': return 'Search by event name, city, or venue...';
      case 'artists': return 'Search for artists by name or genre...';
      case 'venues': return 'Search for venues or cities...';
      case 'organizers': return 'Search for organizers...';
    }
  };

  return (
    <div className="marketplace-page" style={{ minHeight: '100vh' }}>
      <header style={{ padding: '24px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, letterSpacing: '-0.5px' }}>
          Admit <span style={{ color: 'var(--accent)' }}>Marketplace</span>
        </h2>
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/discover" className="btn-nav" style={{ color: 'white' }}>Discover</Link>
          <Link to="/resale" className="btn-nav">Secondary Market</Link>
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
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '32px' }}>Explore the vibrant ecosystem of events, artists, venues, and organizers.</p>

          {/* Search Bar */}
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex' }}>
            <input
              type="text"
              placeholder={getPlaceholder()}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ flexGrow: 1, padding: '16px 24px', fontSize: '1.1rem', borderRadius: '30px', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.05)' }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          {(['events', 'artists', 'venues', 'organizers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedCity(null); setSearchQuery(''); }}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                fontSize: '1.1rem',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <div style={{ position: 'absolute', bottom: '-17px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        {!loading && (activeTab === 'events' || activeTab === 'venues') && uniqueCities.length > 0 && (
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
            {filteredResults.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>No results found matching your criteria.</p>
                <button onClick={() => { setSearchQuery(''); setSelectedCity(null); }} className="btn-secondary" style={{ marginTop: '16px' }}>Clear Filters</button>
              </div>
            ) : (
              filteredResults.map((item) => {
                if (activeTab === 'events') return <EventCard key={item.id} event={item} />;
                if (activeTab === 'artists') return <ArtistCard key={item.id} artist={item} />;
                if (activeTab === 'venues') return <VenueCard key={item.id} venue={item} />;
                if (activeTab === 'organizers') return <OrganizerCard key={item.id} organizer={item} />;
                return null;
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
