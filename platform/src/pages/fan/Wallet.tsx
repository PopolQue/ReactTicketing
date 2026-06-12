import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function Wallet() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Resale Modal State
  const [resellTicket, setResellTicket] = useState<any>(null);
  const [askingPrice, setAskingPrice] = useState<string>('');
  const [listingLoading, setListingLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch tickets and any associated active resale listings
    const { data } = await supabase
      .from('tickets')
      .select(`
        *,
        events ( name, start_date, venue, city, country ),
        ticket_types ( name ),
        resale_listings ( id, is_active, asking_price_cents )
      `)
      .eq('owner_id', user.id);
      
    if (data) setTickets(data);
    setLoading(false);
  }

  const handleListForResale = async (e: React.FormEvent) => {
    e.preventDefault();
    setListingLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const priceCents = Math.round(parseFloat(askingPrice) * 100);

    const { error } = await supabase.from('resale_listings').insert([{
      ticket_id: resellTicket.id,
      seller_id: user.id,
      asking_price_cents: priceCents,
      is_active: true
    }]);

    if (error) {
      showToast("Error listing ticket: " + error.message, 'error');
    } else {
      showToast("Ticket successfully listed on the Resale Market!", 'success');
      setResellTicket(null);
      setAskingPrice('');
      fetchTickets(); // Refresh list
    }
    setListingLoading(false);
  };

  const handleCancelListing = async (listingId: string) => {
    const { error } = await supabase.from('resale_listings').update({ is_active: false }).eq('id', listingId);
    if (!error) {
      fetchTickets();
    }
  };

  return (
    <div className="wallet-page" style={{ minHeight: '100vh', padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>My Ticket Wallet</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/resale" className="btn-secondary" style={{ textDecoration: 'none', backgroundColor: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }}>Secondary Market</Link>
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none' }}>Browse Events</Link>
        </div>
      </header>

      {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading your tickets...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
          {tickets.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '16px' }}>Your wallet is completely empty.</p>
              <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Find an Event</Link>
            </div>
          ) : (
            tickets.map(ticket => {
              // Check if ticket has an active resale listing
              const activeListing = Array.isArray(ticket.resale_listings) 
                ? ticket.resale_listings.find((l: any) => l.is_active) 
                : (ticket.resale_listings?.is_active ? ticket.resale_listings : null);

              return (
                <div key={ticket.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
                    
                    <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${ticket.qr_payload}`} alt="Ticket QR" style={{ width: '180px', height: '180px', display: 'block' }} />
                    </div>
                    <p style={{ textAlign: 'center', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>ID: {ticket.id}</p>
                  </div>

                  <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Status: <strong style={{ color: activeListing ? '#f59e0b' : '#10b981', letterSpacing: '1px' }}>{activeListing ? 'LOCKED' : ticket.status.toUpperCase()}</strong></span>
                     
                     {activeListing ? (
                        <button onClick={() => handleCancelListing(activeListing.id)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', borderColor: '#ef4444', color: '#ef4444' }}>Cancel Listing</button>
                     ) : (
                        <button onClick={() => setResellTicket(ticket)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Resell Ticket</button>
                     )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Resale Modal Overlay */}
      {resellTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '8px' }}>List for Resale</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Selling ticket for <strong>{resellTicket.events?.name}</strong>.
            </p>
            <form onSubmit={handleListForResale} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Asking Price (€)</label>
                <input required type="number" step="0.01" min="1" className="input-field" value={askingPrice} onChange={e => setAskingPrice(e.target.value)} placeholder="e.g. 35.00" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setResellTicket(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={listingLoading} className="btn-primary" style={{ flex: 1 }}>
                  {listingLoading ? 'Listing...' : 'Confirm Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
