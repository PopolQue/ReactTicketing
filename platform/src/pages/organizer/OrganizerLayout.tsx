import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Organizer.css';
import EntitySwitcher, { type Entity } from '../../components/EntitySwitcher';
import { useLanguage } from '../../contexts/LanguageContext';
import Navbar from '../../components/Navbar';

export default function OrganizerLayout() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeEntity, setActiveEntity] = useState<Entity | null>(null);

  useEffect(() => {
    console.log('Active entity changed:', activeEntity);
  }, [activeEntity]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const renderSidebarNav = () => {
    if (activeEntity?.type === 'fan') {
      return (
        <nav className="org-nav" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => navigate('/discover')}
            className={`org-nav-link ${location.pathname === '/discover' ? 'active' : ''}`}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              width: '100%',
            }}
          >
            {t('nav.discover')}
          </button>
          <button
            onClick={() => navigate('/friends')}
            className={`org-nav-link ${location.pathname === '/friends' ? 'active' : ''}`}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              width: '100%',
            }}
          >
            {t('nav.friends')}
          </button>
          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
          <button
            onClick={() => navigate('/profile')}
            className={`org-nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              width: '100%',
            }}
          >
            {t('nav.profile')}
          </button>
          <button
            onClick={() => navigate('/wallet')}
            className={`org-nav-link ${location.pathname === '/wallet' ? 'active' : ''}`}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              width: '100%',
            }}
          >
            {t('nav.wallet')}
          </button>
        </nav>
      );
    }
    // Default Organizer Portal Sidebar
    return (
      <nav className="org-nav" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => navigate('/organizer')}
          className={`org-nav-link ${location.pathname === '/organizer' ? 'active' : ''}`}
          style={{
            padding: '12px',
            textAlign: 'left',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            width: '100%',
          }}
        >
          {t('organizer.layout.dashboard')}
        </button>
        <button
          onClick={() => navigate('/organizer/events')}
          className={`org-nav-link ${location.pathname.includes('/events') ? 'active' : ''}`}
          style={{
            padding: '12px',
            textAlign: 'left',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            width: '100%',
          }}
        >
          {t('organizer.layout.myEvents')}
        </button>
        <button
          onClick={() => navigate('/organizer/artists')}
          className={`org-nav-link ${location.pathname.includes('/artists') ? 'active' : ''}`}
          style={{
            padding: '12px',
            textAlign: 'left',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            width: '100%',
          }}
        >
          {t('organizer.layout.artists')}
        </button>
        <button
          onClick={() => navigate('/organizer/blogs')}
          className={`org-nav-link ${location.pathname.includes('/blogs') ? 'active' : ''}`}
          style={{
            padding: '12px',
            textAlign: 'left',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            width: '100%',
          }}
        >
          {t('organizer.layout.blogs')}
        </button>
        <button
          onClick={() => navigate('/organizer/scan')}
          className={`org-nav-link ${location.pathname.includes('/scan') ? 'active' : ''}`}
          style={{
            padding: '12px',
            textAlign: 'left',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            width: '100%',
          }}
        >
          {t('organizer.layout.scanTickets')}
        </button>
        <button
          onClick={() => navigate('/organizer/marketing')}
          className={`org-nav-link ${location.pathname.includes('/marketing') ? 'active' : ''}`}
          style={{
            padding: '12px',
            textAlign: 'left',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            width: '100%',
          }}
        >
          {t('organizer.layout.marketing')}
        </button>
        <button
          onClick={() => navigate('/organizer/settings')}
          className={`org-nav-link ${location.pathname.includes('/settings') ? 'active' : ''}`}
          style={{
            padding: '12px',
            textAlign: 'left',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            width: '100%',
          }}
        >
          {t('organizer.layout.settings')}
        </button>
      </nav>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <div className="org-layout" style={{ flex: 1, height: 'auto' }}>
        <aside className="org-sidebar glass-panel">
          <div className="org-logo">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2 style={{ margin: 0, cursor: 'pointer' }}>Admit</h2>
            </Link>
            {activeEntity && (
              <div style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {activeEntity.name}
              </div>
            )}
          </div>
          {renderSidebarNav()}
        </aside>
        <main className="org-content">
          <header
            className="org-header glass-panel"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <EntitySwitcher onEntityChange={setActiveEntity} />
            <button onClick={handleLogout} className="btn-secondary">
              {t('organizer.layout.logout')}
            </button>
          </header>
          <div className="org-page-content">
            {activeEntity ? (
              <Outlet context={{ activeEntity }} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {t('organizer.layout.loading')}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
