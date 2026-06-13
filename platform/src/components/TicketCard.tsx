import React from 'react';

export default function TicketCard({ 
  ticket, 
  activeListing, 
  handleCancelListing, 
  setResellTicket 
}: { 
  ticket: any, 
  activeListing: any, 
  handleCancelListing: (id: string) => void, 
  setResellTicket: (ticket: any) => void 
}) {
  return (
    <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {activeListing && (
        <div style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#f59e0b', color: 'black', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10 }}>
          LISTED FOR RESALE (€{(activeListing.asking_price_cents / 100).toFixed(2)})
        </div>
      )}

      <div style={{ padding: '24px', backgroundColor: 'var(--accent)', color: 'white', opacity: activeListing ? 0.7 : 1 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', lineHeight: '1.2' }}>{ticket.events?.name}</h3>
        <p style={{ margin: 0, opacity: 0.9, fontWeight: 500 }}>
          {new Date(ticket.events?.start_date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {ticket.events?.venue}{ticket.events?.city ? `, ${ticket.events.city}` : ''}{ticket.events?.country ? `, ${ticket.events.country}` : ''}
        </p>
      </div>
      
      <div style={{ padding: '32px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: activeListing ? 0.5 : 1 }}>
        <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Ticket Type</p>
        <p style={{ margin: '0 0 32px 0', fontSize: '1.4rem', fontWeight: 700 }}>{ticket.ticket_types?.name}</p>
        
        <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', opacity: ticket.status === 'transferred' ? 0.2 : 1, filter: ticket.status === 'transferred' ? 'blur(4px)' : 'none' }}>
           <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${ticket.qr_payload}`} alt="Ticket QR" style={{ width: '180px', height: '180px', display: 'block' }} />
        </div>
        <p style={{ textAlign: 'center', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>ID: {ticket.id}</p>
      </div>

      <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Status: <strong style={{ color: activeListing ? '#f59e0b' : ticket.status === 'transferred' ? '#ef4444' : '#10b981', letterSpacing: '1px' }}>{activeListing ? 'LOCKED' : ticket.status.toUpperCase()}</strong></span>
         
         {activeListing ? (
            <button onClick={() => handleCancelListing(activeListing.id)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', borderColor: '#ef4444', color: '#ef4444' }}>Cancel Listing</button>
         ) : ticket.status === 'transferred' ? (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No longer valid</span>
         ) : ticket.price_paid_cents <= 0 ? (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', maxWidth: '100px', textAlign: 'right' }}>Complimentary (Non-Resellable)</span>
         ) : (
            <button onClick={() => setResellTicket(ticket)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Resell Ticket</button>
         )}
      </div>
    </div>
  );
}
