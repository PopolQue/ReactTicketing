import { useState, useEffect } from 'react';
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
  const [myClaims, setMyClaims] = useState<any[]>([]);

  const fetchMyClaims = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('entity_claims')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (data) {
      // Enrich with entity names
      const enriched = await Promise.all(data.map(async (claim) => {
        const { data: entityData } = await supabase
          .from(claim.entity_type)
          .select('name')
          .eq('id', claim.entity_id)
          .single();
        return { ...claim, entity: entityData };
      }));
      setMyClaims(enriched);
    }
  };

  useEffect(() => {
    fetchMyClaims();
  }, []);

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

    try {
      // Verify URL using Edge Function
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-url', {
        body: { url: proofUrl }
      });

      if (verificationError) {
        console.error("URL Verification Error:", verificationError);
        // We log the error but allow submission if the Edge Function itself is unreachable/failing
      } else if (verificationData && verificationData.exists === false) {
        setClaimStatus(`Error: The provided URL (${verificationData.isSocial ? 'Social Media Account' : 'Website'}) does not exist or cannot be found.`);
        setSubmitting(false);
        return;
      }
    } catch (err) {
      console.error("Failed to call verification function", err);
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
      fetchMyClaims();
    } else {
      setClaimStatus("Error submitting claim. Please try again.");
    }
  };

  const markProofSubmitted = async (claimId: string) => {
    await supabase.from('entity_claims').update({ status: 'proof_submitted' }).eq('id', claimId);
    fetchMyClaims();
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
    clearSearch,
    myClaims,
    markProofSubmitted
  };
}
