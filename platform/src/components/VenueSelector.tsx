import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import type { Entity } from './EntitySwitcher';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';

export type Venue = {
  id: string;
  name: string;
  city: string;
  country: string;
  is_verified: boolean;
};

interface VenueSelectorProps {
  selectedVenueId: string | null;
  onVenueChange: (venueId: string, venueData?: Partial<Venue>) => void;
}

export default function VenueSelector({ selectedVenueId, onVenueChange }: VenueSelectorProps) {
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const [search, setSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  // If a venue ID is already selected, fetch it to display its name
  useEffect(() => {
    if (selectedVenueId && !selectedVenue) {
      supabase.from('venues').select('*').eq('id', selectedVenueId).single().then(({ data }) => {
        if (data) {
          setSelectedVenue(data);
          setSearch(data.name);
        }
      });
    }
  }, [selectedVenueId, selectedVenue]);

  const skipCondition = useCallback(() => {
    return !search || (selectedVenue !== null && search === selectedVenue.name);
  }, [search, selectedVenue]);

  const { results: venues, loading } = useDebouncedSearch<Venue>(
    search,
    'venues',
    'name',
    'is_verified',
    300,
    skipCondition
  );

  useEffect(() => {
    if (venues.length > 0 && !skipCondition()) {
      setIsDropdownOpen(true);
    }
  }, [venues, skipCondition]);

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setSearch(venue.name);
    setIsDropdownOpen(false);
    onVenueChange(venue.id);
  };

  const handleCreateNew = async () => {
    // Create a stub venue
    const { data: { user } } = await supabase.auth.getUser();
    
    const newVenueId = crypto.randomUUID();
    const newVenueData = {
      id: newVenueId,
      name: search,
      claimed_by_user_id: user?.id || null, // Auto-claim if they created it
      is_verified: false
    };

    const { error } = await supabase.from('venues').insert([newVenueData]);

    if (!error) {
      setSelectedVenue(newVenueData as Venue);
      setIsDropdownOpen(false);
      onVenueChange(newVenueId, newVenueData);
    } else {
      console.error("Error creating venue:", error);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Venue</label>
      <input 
        type="text" 
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (selectedVenue && e.target.value !== selectedVenue.name) {
            setSelectedVenue(null);
            onVenueChange(''); // Clear selection if they start typing a different name
          }
        }}
        onFocus={() => {
          if (venues.length > 0) setIsDropdownOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
        className="input-field"
        placeholder="Search for a venue or type to create a new one"
        required
      />

      {isDropdownOpen && search && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '8px', marginTop: '4px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', maxHeight: '200px', overflowY: 'auto' }}>
          {loading && <div style={{ padding: '12px', color: 'var(--text-secondary)' }}>Searching...</div>}
          {!loading && venues.map(venue => (
            <div 
              key={venue.id}
              onClick={() => handleSelectVenue(venue)}
              style={{ padding: '12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span>{venue.name} <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{venue.city ? `- ${venue.city}` : ''}</span></span>
              {venue.is_verified && <span style={{ color: '#10b981', fontSize: '0.85rem' }}>✓ Verified</span>}
            </div>
          ))}
          {!loading && !venues.find(v => v.name.toLowerCase() === search.toLowerCase()) && (
            <div 
              onClick={handleCreateNew}
              style={{ padding: '12px', color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              + Create "{search}" as a new Venue
            </div>
          )}
        </div>
      )}
    </div>
  );
}
