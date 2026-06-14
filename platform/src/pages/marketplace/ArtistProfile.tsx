import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useFollowEntity } from '../../hooks/useFollowEntity';
import EventCard from '../../components/EventCard';
import Skeleton from '../../components/Skeleton';

export default function ArtistProfile() {
  const { id } = useParams();
  const [artist, setArtist] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { isFollowing, followerCount, toggleFollow, loading: followLoading } = useFollowEntity(id!, 'artist');

  useEffect(() => {
    async function fetchProfile() {
      // Fetch Artist
      const { data: artistData } = await supabase.from('artists').select('*').eq('id', id).single();
      if (artistData) setArtist(artistData);

      // Fetch Upcoming Events
      const { data: eventArtists } = await supabase
        .from('event_artists')
        .select('events(*, organizer_profiles(company_name))')
        .eq('artist_id', id);

      if (eventArtists) {
        // Filter out unpublished/unapproved events and sort by date
        const mappedEvents = eventArtists
          .map((ea: any) => ea.events)
          .filter((e: any) => e.published && e.approval_status === 'approved' && new Date(e.start_date) >= new Date())
          .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        
        setEvents(mappedEvents);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>;
  if (!artist) return <div style={{ padding: '60px', textAlign: 'center' }}>Artist not found.</div>;

  const imageUrl = artist.image_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="marketplace-page" style={{ minHeight: '100vh' }}>
      

      <div style={{ position: 'relative', height: '300px', width: '100%', overflow: 'hidden' }}>
        <div style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundImage: `url(${imageUrl})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'blur(20px) brightness(0.4)',
          transform: 'scale(1.1)'
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto', padding: '40px', display: 'flex', alignItems: 'flex-end', height: '100%', gap: '32px' }}>
          <img src={imageUrl} alt={artist.name} style={{ width: '200px', height: '200px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
          <div style={{ paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '4rem', margin: '0 0 8px 0', fontWeight: 800, letterSpacing: '-2px', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>{artist.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)' }}>{followerCount} Followers</span>
              <button 
                onClick={toggleFollow}
                disabled={followLoading}
                style={{ 
                  padding: '8px 24px', 
                  fontSize: '1rem', 
                  fontWeight: 600, 
                  borderRadius: '20px',
                  border: isFollowing ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  backgroundColor: isFollowing ? 'transparent' : 'var(--accent)',
                  color: 'white',
                  cursor: followLoading ? 'wait' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main style={{ padding: '60px 40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '40px', marginBottom: '40px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>About</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {artist.bio || 'No biography available.'}
          </p>
          {artist.genres && artist.genres.length > 0 && (
             <div style={{ marginTop: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
               {artist.genres.map((g: string) => (
                 <span key={g} style={{ padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.85rem' }}>{g}</span>
               ))}
             </div>
          )}
        </div>

        <h2 style={{ marginBottom: '24px' }}>Upcoming Events</h2>
        {events.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No upcoming events currently scheduled.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
