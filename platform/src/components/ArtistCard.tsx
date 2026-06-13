import React from 'react';
import { Link } from 'react-router-dom';

export default function ArtistCard({ artist }: { artist: any }) {
  const imageUrl = artist.image_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80';
  
  return (
    <Link to={`/artist/${artist.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="glass-panel" style={{ 
        padding: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '20px', 
        transition: 'transform 0.2s, background-color 0.2s',
        cursor: 'pointer'
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
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          flexShrink: 0,
          border: '2px solid rgba(255,255,255,0.1)'
        }} />
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>{artist.name}</h3>
          {artist.genres && artist.genres.length > 0 && (
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--accent)' }}>
              {artist.genres.join(' • ')}
            </p>
          )}
          {artist.bio && (
            <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {artist.bio}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
