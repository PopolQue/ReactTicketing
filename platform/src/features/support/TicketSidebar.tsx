import React from 'react';

export default function TicketSidebar({
  tickets,
  selectedTicket,
  setSelectedTicket
}: {
  tickets: any[];
  selectedTicket: any;
  setSelectedTicket: (ticket: any) => void;
}) {
  return (
    <div className="glass-panel" style={{ width: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ padding: '24px', margin: 0, borderBottom: '1px solid var(--border)' }}>Support Tickets</h2>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {tickets.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No tickets found.</div>
        ) : tickets.map(ticket => (
          <div 
            key={ticket.id} 
            onClick={() => setSelectedTicket(ticket)}
            style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid var(--border)', 
              cursor: 'pointer',
              backgroundColor: selectedTicket?.id === ticket.id ? 'rgba(255,255,255,0.05)' : 'transparent'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>{ticket.email}</span>
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '2px 8px', 
                borderRadius: '12px',
                backgroundColor: ticket.status === 'open' ? '#ef4444' : ticket.status === 'resolved' ? '#10b981' : '#f59e0b',
                color: 'white'
              }}>
                {ticket.status.toUpperCase()}
              </span>
            </div>
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>{ticket.subject}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ticket.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
