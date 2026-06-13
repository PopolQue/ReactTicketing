
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Organizer.css';

export default function OrganizerLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="org-layout">
      <aside className="org-sidebar glass-panel">
        <div className="org-logo">
          <h2>Admit<span style={{ color: 'var(--accent)' }}></span></h2>
        </div>
        <nav className="org-nav">
          <Link to="/organizer" className={`org-nav-link ${location.pathname === '/organizer' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/organizer/events" className={`org-nav-link ${location.pathname.includes('/events') ? 'active' : ''}`}>My Events</Link>
          <Link to="/organizer/artists" className={`org-nav-link ${location.pathname.includes('/artists') ? 'active' : ''}`}>Artists</Link>
          <Link to="/organizer/blogs" className={`org-nav-link ${location.pathname.includes('/blogs') ? 'active' : ''}`}>Blogs</Link>
          <Link to="/organizer/scan" className={`org-nav-link ${location.pathname.includes('/scan') ? 'active' : ''}`}>Scan Tickets</Link>
          <Link to="/organizer/settings" className={`org-nav-link ${location.pathname.includes('/settings') ? 'active' : ''}`}>Settings & Payouts</Link>
        </nav>
      </aside>
      <main className="org-content">
        <header className="org-header glass-panel">
          <h3>Welcome back, Organizer</h3>
          <button onClick={handleLogout} className="btn-secondary">Logout</button>
        </header>
        <div className="org-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
