import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import EntitySwitcher, { type Entity } from '../../components/EntitySwitcher';

export default function WriterLayout() {
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
        <h2 style={{ margin: '0 0 32px 0' }}>Writer<span style={{ color: 'var(--accent)' }}>Portal</span></h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Link to="/writer" className={`btn-nav ${location.pathname === '/writer' ? 'active' : ''}`} style={{ padding: '12px', textAlign: 'left', borderRadius: '8px' }}>Dashboard</Link>
        </nav>
        
        <button onClick={handleLogout} className="btn-secondary" style={{ marginTop: 'auto' }}>Logout</button>
      </aside>

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <EntitySwitcher onEntityChange={setActiveEntity} />
        </header>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {activeEntity ? <Outlet context={{ activeEntity }} /> : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <h3>No Writer Profile Selected</h3>
              <p>You can manage your editorial posts here.</p>
              <Link to="/apply/writer" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>Apply to be a Writer</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
