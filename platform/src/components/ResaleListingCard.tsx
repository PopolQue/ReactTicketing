import React from 'react';

export interface Listing {
  id: string;
  seller_id: string;
  asking_price_cents: number;
  tickets?: {
    events?: {
      name?: string;
      start_date: string;
      venue?: string;
      city?: string;
      country?: string;
    };
    ticket_types?: {
      name?: string;
    };
  };
}

export default function ResaleListingCard({ listing, initBuyTicket }: { listing: Listing, initBuyTicket: (listing: Listing) => void }) {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>{listing.tickets?.events?.name}</h3>
        {listing.tickets?.events?.start_date && (
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {new Date(listing.tickets.events.start_date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {listing.tickets.events.venue}{listing.tickets.events.city ? `, ${listing.tickets.events.city}` : ''}{listing.tickets.events.country ? `, ${listing.tickets.events.country}` : ''}
          </p>
        )}
      </div>

      <div style={{ padding: '16px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '24px', flexGrow: 1 }}>
        <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Ticket Type</p>
        <p style={{ margin: '0 0 0 0', fontWeight: 600 }}>{listing.tickets?.ticket_types?.name}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Asking Price</p>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
            €{(listing.asking_price_cents / 100).toFixed(2)}
          </p>
        </div>
        <button
          onClick={() => initBuyTicket(listing)}
          className="btn-primary"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
