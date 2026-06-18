import React from 'react';
import { Link } from 'react-router-dom';

export const Sidebar = () => {
  const links = [
    { name: 'My Friends', path: '/friends' },
    { name: 'My Wallet', path: '/wallet' },
    { name: 'Followed Artists', path: '/followed/artists' },
    { name: 'Followed Events', path: '/followed/events' },
    { name: 'Followed Venues', path: '/followed/venues' },
    { name: 'Followed Writers', path: '/followed/writers' },
  ];

  return (
    <nav style={{ width: '250px', padding: '20px', borderRight: '1px solid var(--border)', height: '100vh' }}>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {links.map((link) => (
          <li key={link.name} style={{ marginBottom: '15px' }}>
            <Link to={link.path} style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
