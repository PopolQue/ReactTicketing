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
import { useLanguage } from '../../contexts/LanguageContext';
import EventMap from '../../components/marketplace/EventMap';

export default function Discover() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [user, setUser] = useState<unknown>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const { results, loading } = useDiscoverData(activeTab);
  const {
    searchQuery,
    setSearchQuery,
    selectedCity,
    setSelectedCity,
    uniqueCities,
    filteredResults,
    searchCenter,
    setSearchCenter,
    radiusKm,
    setRadiusKm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    locationQuery,
    setLocationQuery
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
    setViewMode('grid');
  };

  const getPlaceholder = () => {
    switch(activeTab) {
      case 'events': return t('marketplace.discover.placeholderEvents');
      case 'artists': return t('marketplace.discover.placeholderArtists');
      case 'venues': return t('marketplace.discover.placeholderVenues');
      case 'organizers': return t('marketplace.discover.placeholderOrganizers');
    }
  };

  return (
    <div className="marketplace-page" style={{ minHeight: '100vh' }}>
      
      <main style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '16px', fontWeight: 800, letterSpacing: '-1px' }}>{t('marketplace.discover.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '32px' }}>{t('marketplace.discover.subtitle')}</p>

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

        {/* View Switcher for Events */}
        {activeTab === 'events' && !loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ display: 'flex', padding: '4px', borderRadius: '30px', background: 'var(--panel-bg)' }}>
              <button 
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}
                style={{ borderRadius: '24px', padding: '8px 20px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
              >
                List View
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}
                style={{ borderRadius: '24px', padding: '8px 20px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', marginLeft: '4px', fontSize: '0.9rem' }}
              >
                Map View
              </button>
            </div>
          </div>
        )}

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
          <div style={{ width: '100%' }}>
            {viewMode === 'map' && activeTab === 'events' ? (
              <EventMap
                events={filteredResults}
                searchCenter={searchCenter}
                setSearchCenter={setSearchCenter}
                radiusKm={radiusKm}
                setRadiusKm={setRadiusKm}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                locationQuery={locationQuery}
                setLocationQuery={setLocationQuery}
                onSelectCity={setSelectedCity}
              />
            ) : filteredResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>{t('marketplace.discover.noResults')}</p>
                <button onClick={() => { setSearchQuery(''); setSelectedCity(null); }} className="btn-secondary" style={{ marginTop: '16px' }}>{t('marketplace.discover.clearFilters')}</button>
              </div>
            ) : activeTab === 'events' ? (
              <>
                {[{ id: 'clubnight', title: t('marketplace.discover.clubnights') }, { id: 'concert', title: t('marketplace.discover.concerts') }, { id: 'festival', title: t('marketplace.discover.festivals') }, { id: 'workshop', title: t('marketplace.discover.workshops') }, { id: 'other', title: t('marketplace.discover.moreEvents') }].map(cat => {
                  const categoryEvents = filteredResults.filter((e: any) => (e.category || 'other') === cat.id);
                  if (categoryEvents.length === 0) return null;
                  return (
                    <div key={cat.id} style={{ marginBottom: '48px' }}>
                      <h2 style={{ fontSize: '2rem', marginBottom: '24px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{cat.title}</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
                        {categoryEvents.map((item: any) => <EventCard key={item.id} event={item} />)}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
                {filteredResults.map((item: any) => {
                  if (activeTab === 'artists') return <ArtistCard key={item.id} artist={item} />;
                  if (activeTab === 'venues') return <VenueCard key={item.id} venue={item} />;
                  if (activeTab === 'organizers') return <OrganizerCard key={item.id} organizer={item} />;
                  return null;
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
