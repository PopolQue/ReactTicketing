import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, BadgeCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FollowButton } from '../../components/FollowButton';
import EventCard from '../../components/EventCard';

export default function VenueProfile() {
  const { t } = useLanguage();
  const { id } = useParams();
  const [venue, setVenue] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading)
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        {t('marketplace.venueProfile.loading')}
      </div>
    );
  if (!venue)
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        {t('marketplace.venueProfile.notFound')}
      </div>
    );

  return (
    <div className="marketplace-page" style={{ minHeight: '100vh' }}>
      <main style={{ padding: '60px 40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}
            >
              <h1 style={{ fontSize: '3.5rem', margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>
                {venue.name}
              </h1>
              {venue.is_verified && <BadgeCheck size={40} color="#10b981" />}
            </div>
            {(venue.city || venue.country) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '1.2rem',
                  marginBottom: '16px',
                }}
              >
                <MapPin size={20} />
                <span>
                  {venue.city}
                  {venue.city && venue.country ? ', ' : ''}
                  {venue.country}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <FollowButton entityId={id!} entityType="venue" className="btn-primary" />
            </div>
          </div>
        </div>

        <h2 style={{ marginBottom: '24px' }}>
          {t('marketplace.venueProfile.upcomingEventsAt')}
          {venue.name}
        </h2>
        {events.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('marketplace.venueProfile.noUpcomingEvents')}
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '32px',
            }}
          >
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
