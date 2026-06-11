import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Wallet() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('tickets')
        .select(`
          *,
          events ( name, start_date, venue ),
          ticket_types ( name )
        `)
        .eq('owner_id', user.id);
        
      if (data) setTickets(data);
      setLoading(false);
    }
    fetchTickets();
  }, []);

  return (
    <div className="wallet-page" style={{ minHeight: '100vh', padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>My Ticket Wallet</h1>
        <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', height: 'fit-content' }}>Browse Events</Link>
      </header>

      {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading your tickets...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
          {tickets.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '16px' }}>Your wallet is completely empty.</p>
              <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Find an Event</Link>
            </div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px', backgroundColor: 'var(--accent)', color: 'white' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', lineHeight: '1.2' }}>{ticket.events?.name}</h3>
                  <p style={{ margin: 0, opacity: 0.9, fontWeight: 500 }}>
                    {new Date(ticket.events?.start_date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {ticket.events?.venue}
                  </p>
                </div>
                <div style={{ padding: '32px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Ticket Type</p>
                  <p style={{ margin: '0 0 32px 0', fontSize: '1.4rem', fontWeight: 700 }}>{ticket.ticket_types?.name}</p>
                  
                  <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                     {/* Mock QR Code generated via free API */}
                     <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${ticket.qr_payload}`} alt="Ticket QR" style={{ width: '180px', height: '180px', display: 'block' }} />
                  </div>
                  <p style={{ textAlign: 'center', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>ID: {ticket.id}</p>
                </div>
                <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Status: <strong style={{ color: '#10b981', letterSpacing: '1px' }}>{ticket.status.toUpperCase()}</strong></span>
                   <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Resell Ticket</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
