import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type TabType = 'events' | 'artists' | 'venues' | 'organizers';

export function useDiscoverData(activeTab: TabType) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setResults([]);
      
      try {
        if (activeTab === 'events') {
          const { data } = await supabase
            .from('events')
            .select(`*, organizer_profiles ( company_name )`)
            .eq('published', true)
            .eq('approval_status', 'approved')
            .order('start_date', { ascending: true })
            .limit(50);
            
          if (data) setResults(data);
        } 
        else if (activeTab === 'artists') {
          const { data } = await supabase.from('artists').select('*').limit(50);
          if (data) setResults(data);
        }
        else if (activeTab === 'venues') {
          const { data } = await supabase.from('venues').select('*').order('is_verified', { ascending: false }).limit(50);
          if (data) setResults(data);
        }
        else if (activeTab === 'organizers') {
          const { data } = await supabase.from('organizers').select('*').limit(50);
          if (data) setResults(data);
        }
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activeTab]);

  return { results, loading };
}
