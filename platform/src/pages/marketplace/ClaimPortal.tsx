import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function ClaimPortal() {
  const navigate = useNavigate();
  const [entityType, setEntityType] = useState<'artists' | 'organizers' | 'venues'>('artists');
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
    } else {
      setClaimStatus("Error submitting claim. Please try again.");
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Claim Your Page</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1.1rem' }}>
        Are you an Artist, Organizer, or Venue? Claim your automatically generated page to get access to analytics, 
        event management, and more.
      </p>

      {claimStatus && (
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', border: '1px solid var(--accent)' }}>
          {claimStatus}
        </div>
      )}

      {!selectedEntity ? (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            {['artists', 'organizers', 'venues'].map(type => (
              <button 
                key={type}
                onClick={() => { setEntityType(type as any); setSearchResults([]); setSearchQuery(''); }}
                className={entityType === type ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, textTransform: 'capitalize' }}
              >
                {type}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder={`Search for unassigned ${entityType}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary">Search</button>
          </form>

          {searchResults.length > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchResults.map(entity => (
                <div key={entity.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {entity.image_url ? (
                      <img src={entity.image_url} alt={entity.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                    )}
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '1.1rem', display: 'block' }}>{entity.name}</span>
                      {entity.city && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{entity.city}</span>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedEntity(entity)} className="btn-secondary">Claim This Profile</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Verify Ownership of {selectedEntity.name}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            To protect our community, we require proof of ownership. Please provide a link that our admins can verify.
          </p>
          <form onSubmit={submitClaim} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Verification Link (e.g., link to your Instagram or Spotify where you added a note, or a link to your official website)
              </label>
              <input 
                required 
                type="url" 
                className="input-field" 
                placeholder="https://instagram.com/..." 
                value={proofUrl}
                onChange={e => setProofUrl(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setSelectedEntity(null)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
