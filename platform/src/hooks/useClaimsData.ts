import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export type EntityType = 'artists' | 'organizers' | 'venues';

export function useClaimsData() {
  const navigate = useNavigate();
  const [entityType, setEntityType] = useState<EntityType>('artists');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Search for entities that are NOT claimed yet
    const { data } = await supabase
      .from(entityType)
      .select('*')
      .ilike('name', `%${searchQuery}%`)
      .is('claimed_by_user_id', null)
      .limit(10);
      
    if (data) setSearchResults(data);
  };

  const submitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Must be logged in to claim
      navigate('/auth');
      return;
    }

    const { error } = await supabase.from('entity_claims').insert([{
      entity_type: entityType,
      entity_id: selectedEntity.id,
      user_id: user.id,
      proof_url: proofUrl,
      status: 'pending'
    }]);

    setSubmitting(false);

    if (!error) {
      setClaimStatus("Success! Your claim has been submitted and is pending admin review.");
      setSelectedEntity(null);
      setSearchQuery('');
      setSearchResults([]);
      setProofUrl('');
    } else {
      setClaimStatus("Error submitting claim. Please try again.");
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setSearchQuery('');
  };

  return {
    entityType,
    setEntityType,
    searchQuery,
    setSearchQuery,
    searchResults,
    submitting,
    proofUrl,
    setProofUrl,
    selectedEntity,
    setSelectedEntity,
    claimStatus,
    handleSearch,
    submitClaim,
    clearSearch
  };
}
