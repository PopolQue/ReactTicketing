import { useState } from 'react';
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <div className="org-layout" style={{ flex: 1, height: 'auto' }}>
        <aside className="org-sidebar glass-panel">
          <div className="org-logo">
            <h2>Admit<span style={{ color: 'var(--accent)' }}></span></h2>
          </div>
          <nav className="org-nav">
            <Link to="/organizer" className={`org-nav-link ${location.pathname === '/organizer' ? 'active' : ''}`}>{t("organizer.layout.dashboard")}</Link>
            <Link to="/organizer/events" className={`org-nav-link ${location.pathname.includes('/events') ? 'active' : ''}`}>{t("organizer.layout.myEvents")}</Link>
            <Link to="/organizer/artists" className={`org-nav-link ${location.pathname.includes('/artists') ? 'active' : ''}`}>{t("organizer.layout.artists")}</Link>
            <Link to="/organizer/blogs" className={`org-nav-link ${location.pathname.includes('/blogs') ? 'active' : ''}`}>{t("organizer.layout.blogs")}</Link>
            <Link to="/organizer/scan" className={`org-nav-link ${location.pathname.includes('/scan') ? 'active' : ''}`}>{t("organizer.layout.scanTickets")}</Link>
            <Link to="/organizer/marketing" className={`org-nav-link ${location.pathname.includes('/marketing') ? 'active' : ''}`}>{t("organizer.layout.marketing")}</Link>
            <Link to="/organizer/settings" className={`org-nav-link ${location.pathname.includes('/settings') ? 'active' : ''}`}>{t("organizer.layout.settings")}</Link>
          </nav>
        </aside>
        <main className="org-content">
          <header className="org-header glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <EntitySwitcher onEntityChange={setActiveEntity} />
            <button onClick={handleLogout} className="btn-secondary">{t("organizer.layout.logout")}</button>
          </header>
          <div className="org-page-content">
            {activeEntity ? <Outlet context={{ activeEntity }} /> : <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t("organizer.layout.loading")}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
