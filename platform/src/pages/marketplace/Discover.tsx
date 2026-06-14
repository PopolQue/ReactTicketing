import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/Skeleton';
import EventCard from '../../components/EventCard';
import ArtistCard from '../../components/ArtistCard';
import VenueCard from '../../components/VenueCard';
import OrganizerCard from '../../components/OrganizerCard';
import { useDiscoverData } from '../../hooks/useDiscoverData';
import type { TabType } from '../../hooks/useDiscoverData';
import { useDiscoverFilters } from '../../hooks/useDiscoverFilters';
import DiscoverTabs from '../../components/marketplace/DiscoverTabs';
import CityFilterList from '../../components/marketplace/CityFilterList';

export default function Discover() {
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [user, setUser] = useState<unknown>(null);

  const { results, loading } = useDiscoverData(activeTab);
  const {
    searchQuery,
    setSearchQuery,
    selectedCity,
    setSelectedCity,
    uniqueCities,
    filteredResults
  } = useDiscoverFilters(results, activeTab);

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) setUser(currentUser);
    }
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedCity(null);
    setSearchQuery('');
  };

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
        <DiscoverTabs activeTab={activeTab} onChangeTab={handleTabChange} />

        {/* Filters */}
        {!loading && (activeTab === 'events' || activeTab === 'venues') && (
          <CityFilterList
            uniqueCities={uniqueCities}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
          />
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
