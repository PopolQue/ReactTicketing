import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function EntityClaims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    setLoading(true);
    const { data: claimsData } = await supabase
      .from('entity_claims')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (claimsData) {
      // Enrich claims with entity names
      const enrichedClaims = await Promise.all(claimsData.map(async (claim) => {
        const { data: entityData } = await supabase
          .from(claim.entity_type)
          .select('name, image_url')
          .eq('id', claim.entity_id)
          .single();
          
        return {
          ...claim,
          entity: entityData || { name: 'Unknown Entity' }
        };
      }));
      setClaims(enrichedClaims);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleAction = async (claimId: string, entityType: string, entityId: string, userId: string, action: 'approved' | 'rejected') => {
    // Update the claim status
    await supabase.from('entity_claims').update({ status: action }).eq('id', claimId);

    if (action === 'approved') {
      // Transfer ownership of the entity profile to the user
      await supabase.from(entityType).update({ 
        claimed_by_user_id: userId,
        is_verified: true
      }).eq('id', entityId);
    }

    fetchClaims();
  };

  if (loading) return <p>Loading claims...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Entity Profile Claims</h2>
      
      {claims.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>There are no pending claims to review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {claims.map(claim => (
            <div key={claim.id} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 {claim.entity?.image_url ? (
                    <img src={claim.entity.image_url} alt="Entity" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                  )}
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{claim.entity?.name} <span style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', border: '1px solid var(--accent)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>{claim.entity_type}</span></h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Requested by User ID: <span style={{ fontFamily: 'monospace' }}>{claim.user_id.substring(0,8)}...</span>
                  </p>
                  <a href={claim.proof_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>View Proof Link</a>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => handleAction(claim.id, claim.entity_type, claim.entity_id, claim.user_id, 'rejected')} 
                  className="btn-secondary" 
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleAction(claim.id, claim.entity_type, claim.entity_id, claim.user_id, 'approved')} 
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
