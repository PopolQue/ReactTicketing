import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import EntitySwitcher, { type Entity } from '../../components/EntitySwitcher';

export default function VenueLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeEntity, setActiveEntity] = useState<Entity | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <aside className="glass-panel" style={{ width: '250px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ margin: '0 0 32px 0' }}>Venue<span style={{ color: 'var(--accent)' }}>Portal</span></h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Link to="/venue" className={`btn-nav ${location.pathname === '/venue' ? 'active' : ''}`} style={{ padding: '12px', textAlign: 'left', borderRadius: '8px' }}>Dashboard</Link>
          <Link to="/venue/edit" className={`btn-nav ${location.pathname === '/venue/edit' ? 'active' : ''}`} style={{ padding: '12px', textAlign: 'left', borderRadius: '8px' }}>Edit Profile</Link>
        </nav>
        
        <button onClick={handleLogout} className="btn-secondary" style={{ marginTop: 'auto' }}>Logout</button>
      </aside>

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <EntitySwitcher onEntityChange={setActiveEntity} />
        </header>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {activeEntity ? <Outlet context={{ activeEntity }} /> : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <h3>No Venue Profile Selected</h3>
              <p>You can manage your venue pages here.</p>
              <Link to="/claim" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>Claim a Profile</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
