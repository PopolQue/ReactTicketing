import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useEvent } from '../../hooks/useEvent';
import { useTicketTiers } from '../../hooks/useTicketTiers';
import { useOutletContext } from 'react-router-dom';
import type { Entity } from '../../components/EntitySwitcher';

// Extracted Domain Components
import ManageEventHeader from '../../features/event-management/ManageEventHeader';
import TicketTiersManager from '../../features/event-management/TicketTiersManager';
import LineupManager from '../../features/event-management/LineupManager';
import ImageUploader from '../../features/event-management/ImageUploader';
import ThemeCustomizer from '../../features/event-management/ThemeCustomizer';
import ScanAccountsManager from '../../features/event-management/ScanAccountsManager';
import PromoManager from '../../features/event-management/PromoManager';
import ScanDashboard from '../../features/event-management/ScanDashboard';
import ExportManager from '../../features/event-management/ExportManager';
import CheckoutFieldsManager from '../../features/event-management/CheckoutFieldsManager';

export default function ManageEvent() {
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const { id } = useParams();
  
  // Custom Hooks
  const { event, loading: eventLoading, updateEvent } = useEvent(id);
  const { tiers, loading: tiersLoading, setTiers } = useTicketTiers(id) as any;

  // Local State for specific fetches
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [availableArtists, setAvailableArtists] = useState<any[]>([]);
  const [eventArtists, setEventArtists] = useState<any[]>([]);
  const [theme, setTheme] = useState({ bgColor: '#0f1115', accentColor: '#6366f1', thumbnailPosition: '50% 50%' });
  const [initialThemeLoaded, setInitialThemeLoaded] = useState(false);

  useEffect(() => {
    async function fetchAncillaryData() {
      if (activeEntity) {
        const { data: profile } = await supabase.from('organizers').select('subscription_tier').eq('id', activeEntity.id).single();
        if (profile) setSubscriptionTier(profile.subscription_tier);

        const { data: artistsData } = await supabase.from('artists').select('*').eq('created_by', activeEntity.id);
        if (artistsData) setAvailableArtists(artistsData);
      }

      if (id) {
        const { data: eventArtistsData } = await supabase.from('event_artists').select('*, artists(*)').eq('event_id', id);
        if (eventArtistsData) setEventArtists(eventArtistsData);
      }
    }
    fetchAncillaryData();
  }, [id, activeEntity]);

  // Sync theme when event loads
  useEffect(() => {
    if (event && event.theme_customization && !initialThemeLoaded) {
      // eslint-disable-next-line
      setTheme({
        bgColor: event.theme_customization.bgColor || '#0f1115',
        accentColor: event.theme_customization.accentColor || '#6366f1',
        thumbnailPosition: event.theme_customization.thumbnailPosition || '50% 50%'
      });
      setInitialThemeLoaded(true);
    }
  }, [event, initialThemeLoaded]);

  const saveTheme = async () => {
    await updateEvent({ theme_customization: theme });
  };

  if (eventLoading || tiersLoading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div className="manage-event-page" style={{ maxWidth: '1000px' }}>
      <ManageEventHeader 
        event={event} 
        eventId={id!} 
        updateEvent={updateEvent} 
        subscriptionTier={subscriptionTier} 
        tiersCount={tiers.length} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Ticket Tiers Section */}
          <TicketTiersManager 
            event={event} 
            eventId={id!} 
            tiers={tiers} 
            setTiers={setTiers} 
            updateEvent={updateEvent} 
          />
          <CheckoutFieldsManager eventId={id!} />
          <PromoManager eventId={id!} />
          <ScanAccountsManager eventId={id!} />
          <ScanDashboard eventId={id!} />
          <ExportManager eventId={id!} eventName={event?.name} />
        </div>

        {/* Artists Lineup Section */}
        <LineupManager 
          eventId={id!} 
          availableArtists={availableArtists} 
          eventArtists={eventArtists} 
          setEventArtists={setEventArtists} 
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Images Section */}
          <ImageUploader 
            eventId={id!} 
            event={event} 
            updateEvent={updateEvent} 
            theme={theme} 
            setTheme={setTheme} 
            subscriptionTier={subscriptionTier} 
          />

          {/* Theme Customization Section */}
          <ThemeCustomizer 
            theme={theme} 
            setTheme={setTheme} 
            saveTheme={saveTheme} 
            subscriptionTier={subscriptionTier} 
          />
        </div>
      </div>
    </div>
  );
}
