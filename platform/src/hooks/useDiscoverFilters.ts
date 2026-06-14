import { useState, useMemo } from 'react';
import type { TabType } from './useDiscoverData';

export function useDiscoverFilters(results: any[], activeTab: TabType) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Derive unique cities (only relevant for events and venues)
  const uniqueCities = useMemo(() => {
    return Array.from(new Set(
      results.map(r => r.city).filter(Boolean)
    )) as string[];
  }, [results]);

  // Filter based on search and selected city
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      const matchesCity = selectedCity ? item.city === selectedCity : true;
      let matchesSearch = true;
      
      if (searchQuery !== '') {
        const q = searchQuery.toLowerCase();
        if (activeTab === 'events') {
          matchesSearch = item.name?.toLowerCase().includes(q) || (item.city && item.city.toLowerCase().includes(q)) || (item.venue && item.venue.toLowerCase().includes(q));
        } else if (activeTab === 'artists') {
          matchesSearch = item.name?.toLowerCase().includes(q) || (item.genres && item.genres.join(' ').toLowerCase().includes(q));
        } else if (activeTab === 'venues') {
          matchesSearch = item.name?.toLowerCase().includes(q) || (item.city && item.city.toLowerCase().includes(q));
        } else if (activeTab === 'organizers') {
          matchesSearch = item.company_name?.toLowerCase().includes(q);
        }
      }

      return matchesCity && matchesSearch;
    });
  }, [results, activeTab, selectedCity, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCity,
    setSelectedCity,
    uniqueCities,
    filteredResults
  };
}
