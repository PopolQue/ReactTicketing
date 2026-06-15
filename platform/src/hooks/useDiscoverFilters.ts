import { useState, useMemo, useEffect } from 'react';
import type { TabType } from './useDiscoverData';

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Berlin': { lat: 52.5200, lng: 13.4050 },
  'München': { lat: 48.1351, lng: 11.5820 },
  'Munich': { lat: 48.1351, lng: 11.5820 },
  'Hamburg': { lat: 53.5511, lng: 9.9937 },
  'Köln': { lat: 50.9375, lng: 6.9603 },
  'Cologne': { lat: 50.9375, lng: 6.9603 },
  'Frankfurt': { lat: 50.1109, lng: 8.6821 },
  'Stuttgart': { lat: 48.7758, lng: 9.1829 },
  'Düsseldorf': { lat: 51.2277, lng: 6.7735 },
  'Dortmund': { lat: 51.5136, lng: 7.4653 },
  'Essen': { lat: 51.4556, lng: 7.0116 },
  'Leipzig': { lat: 51.3397, lng: 12.3731 },
  'Bremen': { lat: 53.0793, lng: 8.8017 },
  'Dresden': { lat: 51.0504, lng: 13.7373 },
  'Hannover': { lat: 52.3759, lng: 9.7320 },
  'Nürnberg': { lat: 49.4521, lng: 11.0767 },
  'Nuremberg': { lat: 49.4521, lng: 11.0767 },
  'Duisburg': { lat: 51.4344, lng: 6.7623 },
  'Bochum': { lat: 51.4818, lng: 7.2162 },
  'Wuppertal': { lat: 51.2562, lng: 7.1508 },
  'Bielefeld': { lat: 52.0302, lng: 8.5325 },
  'Bonn': { lat: 50.7374, lng: 7.0982 },
};

// Haversine formula to calculate distance in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function useDiscoverFilters(results: any[], activeTab: TabType) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Unified Geographic & Timeframe Filters
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number }>({ lat: 52.5200, lng: 13.4050 }); // Default Berlin
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [locationQuery, setLocationQuery] = useState('Berlin, Germany');

  // Sync selectedCity -> Map coordinates
  useEffect(() => {
    if (selectedCity) {
      const coords = CITY_COORDINATES[selectedCity];
      if (coords) {
        setSearchCenter(coords);
        setLocationQuery(`${selectedCity}, Germany`);
      } else {
        setLocationQuery(selectedCity);
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(selectedCity)}&limit=1`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              setSearchCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
            }
          })
          .catch(err => console.error('Geocoding sync failed:', err));
      }
    }
  }, [selectedCity]);

  // Derive unique cities
  const uniqueCities = useMemo(() => {
    return Array.from(new Set(
      results.map(r => r.city).filter(Boolean)
    )) as string[];
  }, [results]);

  // Filter based on search query, selected city, coordinate radius, and timeframe
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      // 1. City Filter
      const matchesCity = selectedCity ? item.city === selectedCity : true;
      if (!matchesCity) return false;

      // 2. Search Query Filter
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
      if (!matchesSearch) return false;

      // 3. Geographic / Coordinate Filter (only for events with valid coordinates)
      if (activeTab === 'events') {
        const lat = item.latitude;
        const lng = item.longitude;
        if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
          const distance = getDistance(searchCenter.lat, searchCenter.lng, lat, lng);
          if (distance > radiusKm) return false;
        }

        // 4. Timeframe Filter
        if (item.start_date) {
          const eventTime = new Date(item.start_date).getTime();
          // Use UTC dates to avoid timezone-related off-by-one errors
          const startLimit = new Date(startDate + 'T00:00:00Z').getTime();
          const endLimit = new Date(endDate + 'T23:59:59Z').getTime();
          if (eventTime < startLimit || eventTime > endLimit) return false;
        }
      }

      return true;
    });
  }, [results, activeTab, selectedCity, searchQuery, searchCenter, radiusKm, startDate, endDate]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCity,
    setSelectedCity,
    uniqueCities,
    filteredResults,
    searchCenter,
    setSearchCenter,
    radiusKm,
    setRadiusKm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    locationQuery,
    setLocationQuery
  };
}
