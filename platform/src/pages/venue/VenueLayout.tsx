import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import EntitySwitcher, { type Entity } from '../../components/EntitySwitcher';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VenueLayout() {
  const { t } = useLanguage();
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
        <h2 style={{ margin: '0 0 32px 0' }}>{t('venue_layout_title').split(' ')[0]}<span style={{ color: 'var(--accent)' }}>{t('venue_layout_title').split(' ').pop()}</span></h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button onClick={() => navigate('/venue')} className={`btn-nav ${location.pathname === '/venue' ? 'active' : ''}`} style={{ padding: '12px', textAlign: 'left', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', width: '100%' }}>{t('venue_layout_dashboard')}</button>
          <button onClick={() => navigate('/venue/edit')} className={`btn-nav ${location.pathname === '/venue/edit' ? 'active' : ''}`} style={{ padding: '12px', textAlign: 'left', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', width: '100%' }}>{t('venue_layout_edit_profile')}</button>
        </nav>
        
        <button onClick={handleLogout} className="btn-secondary" style={{ marginTop: 'auto' }}>{t('venue_layout_logout')}</button>
      </aside>

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <EntitySwitcher onEntityChange={setActiveEntity} />
        </header>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {activeEntity ? <Outlet context={{ activeEntity }} /> : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <h3>{t('venue_layout_no_profile')}</h3>
              <p>{t('venue_layout_manage_desc')}</p>
              <Link to="/claim" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>{t('venue_layout_claim')}</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
