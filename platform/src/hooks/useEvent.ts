import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useEvent(id: string | undefined) {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, organizer_profiles(company_name)')
      .eq('id', id)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setEvent(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchEvent();
  }, [fetchEvent]);

  const updateEvent = async (updates: any) => {
    if (!id) return { error: new Error('No event ID') };
    const { error } = await supabase.from('events').update(updates).eq('id', id);
    if (!error) {
      setEvent((prev: any) => ({ ...prev, ...updates }));
    }
    return { error };
  };

  return { event, loading, error, updateEvent, refetch: fetchEvent };
}
