import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck } from 'lucide-react';

export default function VenueCard({ venue }: { venue: any }) {
  // Venues might not have images yet, use a stylish dark gradient
  const backgroundStyle = {
    background: 'linear-gradient(135deg, rgba(20,20,25,1) 0%, rgba(40,40,50,1) 100%)',
  };
  
  return (
    <Link to={`/venue/${venue.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="glass-panel" style={{ 
        ...backgroundStyle,
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        minHeight: '140px',
        position: 'relative',
        transition: 'transform 0.2s',
        cursor: 'pointer',
        border: '1px solid var(--border)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', color: 'var(--text-primary)' }}>{venue.name}</h3>
          {venue.is_verified && (
            <BadgeCheck size={20} color="#10b981" style={{ flexShrink: 0 }} />
          )}
        </div>
        
        {(venue.city || venue.country) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            <MapPin size={16} />
            <span>{venue.city}{venue.city && venue.country ? ', ' : ''}{venue.country}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
