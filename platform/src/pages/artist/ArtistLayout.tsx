import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ArtistLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [claim, setClaim] = useState<any>(null);

  useEffect(() => {
    async function checkClaim() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('artist_claims')
        .select('*, artists(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (data) {
        setClaim(data);
      }
      setLoading(false);
    }
    checkClaim();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading Artist Profile...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <aside className="glass-panel" style={{ width: '250px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ margin: '0 0 32px 0' }}>Artist<span style={{ color: 'var(--accent)' }}>Portal</span></h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Link to="/artist" className={`btn-nav ${location.pathname === '/artist' ? 'active' : ''}`} style={{ padding: '12px', textAlign: 'left', borderRadius: '8px' }}>Dashboard</Link>
          {claim?.status === 'approved' && (
            <Link to="/artist/edit" className={`btn-nav ${location.pathname === '/artist/edit' ? 'active' : ''}`} style={{ padding: '12px', textAlign: 'left', borderRadius: '8px' }}>Edit Profile</Link>
          )}
        </nav>
        
        <button onClick={handleLogout} className="btn-secondary" style={{ marginTop: 'auto' }}>Logout</button>
      </aside>

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Outlet context={{ claim }} />
        </div>
      </main>
    </div>
  );
}
