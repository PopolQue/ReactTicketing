import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useFollowEntity } from '../../hooks/useFollowEntity';
import EventCard from '../../components/EventCard';
import { MapPin, BadgeCheck } from 'lucide-react';

export default function VenueProfile() {
  const { id } = useParams();
  const [venue, setVenue] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { isFollowing, followerCount, toggleFollow, loading: followLoading } = useFollowEntity(id!, 'venue');

  useEffect(() => {
    async function fetchProfile() {
      // Fetch Venue
      const { data: venueData } = await supabase.from('venues').select('*').eq('id', id).single();
      if (venueData) setVenue(venueData);

      // Fetch Upcoming Events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*, organizers(name)')
        .eq('venue_id', id)
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
  if (!venue) return <div style={{ padding: '60px', textAlign: 'center' }}>Venue not found.</div>;

  return (
    <div className="marketplace-page" style={{ minHeight: '100vh' }}>
      

      <main style={{ padding: '60px 40px', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <h1 style={{ fontSize: '3.5rem', margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>{venue.name}</h1>
              {venue.is_verified && <BadgeCheck size={40} color="#10b981" />}
            </div>
            {(venue.city || venue.country) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '16px' }}>
                <MapPin size={20} />
                <span>{venue.city}{venue.city && venue.country ? ', ' : ''}{venue.country}</span>
              </div>
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
                {isFollowing ? 'Following' : 'Follow Venue'}
              </button>
            </div>
          </div>
        </div>

        <h2 style={{ marginBottom: '24px' }}>Upcoming Events at {venue.name}</h2>
        {events.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No upcoming events currently scheduled at this venue.</p>
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
