import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import UpscaledImage from './UpscaledImage';

export default function EventCard({ event }: { event: any }) {
  return (
    <Link to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="glass-panel event-card-hover" style={{ padding: '24px', height: '100%' }}>
        {event.images && event.images.length > 0 ? (
          <div style={{ height: '180px', borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' }}>
            <UpscaledImage 
              src={event.images[0]} 
              scaleFactor={1.5}
              sharpen={true}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: event.theme_customization?.thumbnailPosition || '50% 50%' }} 
              alt="Event Thumbnail" 
            />
          </div>
        ) : (
          <div style={{ height: '180px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ opacity: 0.2, color: 'var(--text-secondary)' }}><Ticket size={48} /></span>
          </div>
        )}
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', lineHeight: '1.3', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {event.name}
          {event.is_external && <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: '12px', verticalAlign: 'middle', fontWeight: 'bold' }}>EXTERNAL</span>}
        </h3>
        <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {event.venue}{event.city ? `, ${event.city}` : ''}{event.country ? `, ${event.country}` : ''}
        </p>
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--accent)', fontWeight: 600 }}>
          By {event.organizer_profiles?.company_name || 'Independent Organizer'}
        </p>
      </div>
    </Link>
  );
}
