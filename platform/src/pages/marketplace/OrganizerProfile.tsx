import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { FollowButton } from '../../components/FollowButton';
import EventCard from '../../components/EventCard';


export default function OrganizerProfile() {
  const { t } = useLanguage();
  const { id } = useParams();
  const [organizer, setOrganizer] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      // Fetch Organizer
      const { data: orgData } = await supabase.from('organizers').select('*').eq('id', id).single();
      if (orgData) setOrganizer(orgData);

      // Fetch Upcoming Events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*, organizers(name)')
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

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>{t('marketplace.organizerProfile.loading')}</div>;
  if (!organizer) return <div style={{ padding: '60px', textAlign: 'center' }}>{t('marketplace.organizerProfile.notFound')}</div>;

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
              <FollowButton 
                entityId={id!} 
                entityType="organizer"
                className="btn-primary"
              />
            </div>
          </div>
        </div>

        <h2 style={{ marginBottom: '24px' }}>{t('marketplace.organizerProfile.eventsBy')}{organizer.company_name}</h2>
        {events.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>{t('marketplace.organizerProfile.noUpcomingEvents')}</p>
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
