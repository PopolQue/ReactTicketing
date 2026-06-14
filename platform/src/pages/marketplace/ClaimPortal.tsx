import React from 'react';
import { useClaimsData } from '../../hooks/useClaimsData';
import type { EntityType } from '../../hooks/useClaimsData';
import ClaimsList from '../../components/marketplace/ClaimsList';

export default function ClaimPortal() {
  const {
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
  } = useClaimsData();

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
            {(['artists', 'organizers', 'venues'] as EntityType[]).map(type => (
              <button 
                key={type}
                onClick={() => { setEntityType(type); clearSearch(); }}
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

          <ClaimsList searchResults={searchResults} onSelectEntity={setSelectedEntity} />
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
