import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useEventData(eventId: string | undefined) {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<any[]>([]);
  const [eventArtists, setEventArtists] = useState<any[]>([]);

  useEffect(() => {
    if (!eventId) {
      // eslint-disable-next-line
      setLoading(false);
      return;
    }

    async function fetchEventDetails() {
      const { data, error } = await supabase
        .from('events')
        .select(`*, organizers(name, marketing_pixels)`)
        .eq('id', eventId)
        .single();

      if (data) {
        setEvent(data);
        document.title = `${data.name} | Admit`;
      }

      const { data: tiersData } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId);

      if (tiersData) setTiers(tiersData);

      const { data: artistsData } = await supabase
        .from('event_artists')
        .select('*, artists(*)')
        .eq('event_id', eventId);
        
      if (artistsData) setEventArtists(artistsData);

      setLoading(false);
    }

    fetchEventDetails();
    return () => { document.title = 'Admit'; }
  }, [eventId]);

  return { event, tiers, eventArtists, loading };
}
