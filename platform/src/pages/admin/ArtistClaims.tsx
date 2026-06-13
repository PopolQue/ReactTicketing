import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ArtistClaims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('artist_claims')
      .select('*, artists(name, image_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (data) setClaims(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleAction = async (claimId: string, artistId: string, userId: string, action: 'approved' | 'rejected') => {
    // Update the claim status
    await supabase.from('artist_claims').update({ status: action }).eq('id', claimId);

    if (action === 'approved') {
      // Transfer ownership of the artist profile to the user
      await supabase.from('artists').update({ 
        claimed_by_user_id: userId,
        is_verified: true
      }).eq('id', artistId);
    }

    fetchClaims();
  };

  if (loading) return <p>Loading claims...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Artist Profile Claims</h2>
      
      {claims.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>There are no pending claims to review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {claims.map(claim => (
            <div key={claim.id} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 {claim.artists?.image_url ? (
                    <img src={claim.artists.image_url} alt="Artist" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                  )}
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{claim.artists?.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Requested by User ID: <span style={{ fontFamily: 'monospace' }}>{claim.user_id.substring(0,8)}...</span>
                  </p>
                  <a href={claim.proof_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>View Proof Link</a>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => handleAction(claim.id, claim.artist_id, claim.user_id, 'rejected')} 
                  className="btn-secondary" 
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleAction(claim.id, claim.artist_id, claim.user_id, 'approved')} 
                  className="btn-primary"
                  style={{ backgroundColor: '#10b981' }}
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
