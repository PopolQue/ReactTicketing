import React from 'react';
import { Link } from 'react-router-dom';

export default function OrganizerCard({ organizer }: { organizer: any }) {
  const imageUrl =
    organizer.logo_url ||
    'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=500&q=80'; // generic office/team photo

  return (
    <Link
      to={`/organizer/${organizer.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          transition: 'transform 0.2s, background-color 0.2s',
          cursor: 'pointer',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.1)',
          }}
        />
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
            {organizer.company_name}
          </h3>
          {organizer.bio && (
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {organizer.bio}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
