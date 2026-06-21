import { useLanguage } from '../contexts/LanguageContext';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import type { Entity } from './EntitySwitcher';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';
import { Autosuggest } from './Autosuggest';
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
  const { t } = useLanguage();
  const { activeEntity } = useOutletContext<{
    activeEntity: Entity;
  }>();
  const [search, setSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  // If a venue ID is already selected, fetch it to display its name
  useEffect(() => {
    if (selectedVenueId && !selectedVenue) {
      supabase
        .from('venues')
        .select('*')
        .eq('id', selectedVenueId)
        .single()
        .then(({ data }) => {
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

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setSearch(venue.name);
    onVenueChange(venue.id);
  };
  const handleCreateNew = async () => {
    // Create a stub venue
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const newVenueId = crypto.randomUUID();
    const newVenueData = {
      id: newVenueId,
      name: search,
      claimed_by_user_id: user?.id || null,
      // Auto-claim if they created it
      is_verified: false,
    };
    const { error } = await supabase.from('venues').insert([newVenueData]);
    if (!error) {
      setSelectedVenue(newVenueData as Venue);
      onVenueChange(newVenueId, newVenueData);
    } else {
      console.error('Error creating venue:', error);
    }
  };
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: '8px',
          color: 'var(--text-secondary)',
        }}
      >
        {t('venue')}
      </label>

      <Autosuggest<Venue>
        value={search}
        onChange={(val) => {
          setSearch(val);
          if (selectedVenue && val !== selectedVenue.name) {
            setSelectedVenue(null);
            onVenueChange('');
          }
        }}
        results={venues}
        onSelect={handleSelectVenue}
        isLoading={loading}
        placeholder={t('searchForAVenueOrTypeTo')}
        renderItem={(venue) => (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              {venue.name}{' '}
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {venue.city ? `- ${venue.city}` : ''}
              </span>
            </span>
            {venue.is_verified && (
              <span style={{ color: '#10b981', fontSize: '0.85rem' }}>{t('Verified')}</span>
            )}
          </div>
        )}
      />

      {search && !venues.find((v) => v.name.toLowerCase() === search.toLowerCase()) && !loading && (
        <div
          onClick={handleCreateNew}
          style={{
            padding: '12px',
            marginTop: '4px',
            color: 'var(--accent)',
            cursor: 'pointer',
            fontWeight: 500,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
          }}
        >
          {t('Create')}
          {search}
          {t('AsANewVenue')}
        </div>
      )}
    </div>
  );
}
