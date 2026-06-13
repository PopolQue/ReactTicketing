import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import TicketCard from '../../components/TicketCard';

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
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  activeListing={activeListing} 
                  handleCancelListing={handleCancelListing} 
                  setResellTicket={setResellTicket} 
                />
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
