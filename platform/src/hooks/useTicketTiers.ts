import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTicketTiers(eventId: string | undefined) {
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTiers = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    const { data } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId);

    if (data) setTiers(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchTiers();
  }, [fetchTiers]);

  const createTier = async (tier: { name: string; capacity: number; pricing: any }) => {
    if (!eventId) return { error: new Error('No event ID') };
    const { data, error } = await supabase.from('ticket_types').insert([{
      id: crypto.randomUUID(),
      event_id: eventId,
      ...tier
    }]).select();

    if (!error && data) {
      setTiers(prev => [...prev, data[0]]);
    }
    return { data, error };
  };

  return { tiers, setTiers, loading, createTier, refetch: fetchTiers };
}
