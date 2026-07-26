import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const Sidebar = () => {
  const [activeEntity, setActiveEntity] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const raw = localStorage.getItem('active_entity');
    if (raw) {
      try {
        setActiveEntity(JSON.parse(raw));
      } catch (e) {
        setActiveEntity(null);
      }
    }

    const onChange = (e: any) => {
      setActiveEntity(e?.detail || null);
    };
    window.addEventListener('activeEntityChanged', onChange as EventListener);
    window.addEventListener('storage', () => {
      const r = localStorage.getItem('active_entity');
      setActiveEntity(r ? JSON.parse(r) : null);
    });
    return () => {
      window.removeEventListener('activeEntityChanged', onChange as EventListener);
      window.removeEventListener('storage', () => {});
    };
  }, []);

  const commonLinks = [
    { name: 'Profile', path: '/profile' },
    { name: 'Wallet', path: '/wallet' },
  ];

  const renderLinksForType = (type: string | undefined) => {
    switch (type) {
      case 'organizer':
        return [
          { name: 'Dashboard', path: '/organizer' },
          { name: 'Events', path: '/organizer/events' },
          { name: 'Artists', path: '/organizer/artists' },
          { name: 'Blogs', path: '/organizer/blogs' },
          { name: 'Scan', path: '/organizer/scan' },
          { name: 'Marketing', path: '/organizer/marketing' },
          { name: 'Settings', path: '/organizer/settings' },
        ];
      case 'artist':
        return [
          { name: 'Dashboard', path: '/artist' },
          { name: 'Edit Profile', path: '/artist/edit' },
        ];
      case 'venue':
        return [
          { name: 'Dashboard', path: '/venue' },
          { name: 'Edit Profile', path: '/venue/edit' },
        ];
      case 'writer':
        return [
          { name: 'Dashboard', path: '/writer' },
          { name: 'Posts', path: '/writer/posts' },
        ];
      default:
        return [
          { name: 'Discover', path: '/discover' },
          { name: 'Friends', path: '/friends' },
        ];
    }
  };

  const navLinks = renderLinksForType(activeEntity?.type);

  return (
    <nav
      style={{
        width: '250px',
        padding: '20px',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2 style={{ margin: 0, cursor: 'pointer' }}>Admit</h2>
        </Link>
        {activeEntity && (
          <div style={{ marginTop: '8px' }}>
            <span style={{ fontWeight: 600, display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {activeEntity.name}
            </span>
            <small style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {activeEntity.type}
            </small>
          </div>
        )}
      </div>

      <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
        {navLinks.map((link) => (
          <li key={link.name} style={{ marginBottom: '12px' }}>
            <button
              onClick={() => navigate(link.path)}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 0',
                width: '100%',
                textAlign: 'left',
                color: location.pathname === link.path ? 'var(--accent)' : 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {link.name}
            </button>
          </li>
        ))}

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

        {commonLinks.map((link) => (
          <li key={link.name} style={{ marginBottom: '12px' }}>
            <button
              onClick={() => navigate(link.path)}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 0',
                width: '100%',
                textAlign: 'left',
                color: location.pathname === link.path ? 'var(--accent)' : 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {link.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
