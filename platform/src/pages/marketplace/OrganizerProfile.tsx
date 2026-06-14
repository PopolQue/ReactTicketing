import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useFollowEntity } from '../../hooks/useFollowEntity';
import EventCard from '../../components/EventCard';

export default function OrganizerProfile() {
  const { id } = useParams();
  const [organizer, setOrganizer] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { isFollowing, followerCount, toggleFollow, loading: followLoading } = useFollowEntity(id!, 'organizer');

  useEffect(() => {
    async function fetchProfile() {
      // Fetch Organizer
      const { data: orgData } = await supabase.from('organizer_profiles').select('*').eq('id', id).single();
      if (orgData) setOrganizer(orgData);

      // Fetch Upcoming Events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*, organizer_profiles(company_name)')
        .eq('organizer_id', id)
        .eq('published', true)
        .eq('approval_status', 'approved')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (eventsData) {
        setEvents(eventsData);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>;
  if (!organizer) return <div style={{ padding: '60px', textAlign: 'center' }}>Organizer not found.</div>;

  const imageUrl = organizer.logo_url || 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="marketplace-page" style={{ minHeight: '100vh' }}>
      

      <main style={{ padding: '60px 40px', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div className="glass-panel" style={{ padding: '40px', marginBottom: '40px', display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
          <img src={imageUrl} alt={organizer.company_name} style={{ width: '160px', height: '160px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
          <div style={{ flexGrow: 1 }}>
            <h1 style={{ fontSize: '3rem', margin: '0 0 16px 0', fontWeight: 800, letterSpacing: '-1px' }}>{organizer.company_name}</h1>
            
            {organizer.bio && (
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px', maxWidth: '600px' }}>
                {organizer.bio}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{followerCount} Followers</span>
              <button 
                onClick={toggleFollow}
                disabled={followLoading}
                style={{ 
                  padding: '8px 24px', 
                  fontSize: '1rem', 
                  fontWeight: 600, 
                  borderRadius: '20px',
                  border: isFollowing ? '1px solid var(--border)' : 'none',
                  backgroundColor: isFollowing ? 'rgba(255,255,255,0.05)' : 'var(--accent)',
                  color: 'white',
                  cursor: followLoading ? 'wait' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isFollowing ? 'Following' : 'Follow Organizer'}
              </button>
            </div>
          </div>
        </div>

        <h2 style={{ marginBottom: '24px' }}>Events by {organizer.company_name}</h2>
        {events.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No upcoming events currently scheduled by this organizer.</p>
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
