import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ArtistDashboard() {
  const { claim } = useOutletContext<{ claim: any }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Search for artists that are NOT claimed yet
    const { data } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', `%${searchQuery}%`)
      .is('claimed_by_user_id', null)
      .limit(10);
      
    if (data) setSearchResults(data);
  };

  const submitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtist) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('artist_claims').insert([{
      artist_id: selectedArtist.id,
      user_id: user.id,
      proof_url: proofUrl,
      status: 'pending'
    }]);

    window.location.reload(); // Reload to fetch the new claim state in layout
  };

  if (claim) {
    if (claim.status === 'pending') {
      return (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ margin: '0 0 16px 0' }}>Verification Pending</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Your claim for <strong>{claim.artists.name}</strong> is currently being reviewed by our admins.
            We will email you once it's approved.
          </p>
        </div>
      );
    }
    
    if (claim.status === 'approved') {
      return (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ margin: '0 0 16px 0' }}>Welcome, {claim.artists.name}!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Your account is verified. You can now edit your artist page from the sidebar.
          </p>
        </div>
      );
    }

    if (claim.status === 'rejected') {
       return (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', border: '1px solid #ef4444' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
          <h2 style={{ margin: '0 0 16px 0' }}>Claim Rejected</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            We could not verify your identity for <strong>{claim.artists.name}</strong>. Please contact support.
          </p>
        </div>
      );
    }
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 24px 0' }}>Claim Your Artist Profile</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Search for your automatically generated artist page below to claim it. Our team will review your request.
      </p>

      {!selectedArtist ? (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search by artist name..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary">Search</button>
          </form>

          {searchResults.length > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchResults.map(artist => (
                <div key={artist.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {artist.image_url ? (
                      <img src={artist.image_url} alt={artist.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                    )}
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{artist.name}</span>
                  </div>
                  <button onClick={() => setSelectedArtist(artist)} className="btn-secondary">Claim This Profile</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Verify Ownership of {selectedArtist.name}</h3>
          <form onSubmit={submitClaim} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Verification Link (e.g., link to your Instagram or Spotify where you added a note, or a management email screenshot)
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
              <button type="button" onClick={() => setSelectedArtist(null)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
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
