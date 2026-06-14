import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import TicketCard from '../../components/TicketCard';
import Modal from '../../components/Modal';

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

  const renderTicketList = (ticketList: any[]) => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
        {ticketList.map(ticket => {
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
        })}
      </div>
    );
  };

  const now = new Date();
  const upcomingTickets = tickets.filter(t => new Date(t.events?.start_date || 0) >= now)
    .sort((a, b) => new Date(a.events?.start_date || 0).getTime() - new Date(b.events?.start_date || 0).getTime());
  const pastTickets = tickets.filter(t => new Date(t.events?.start_date || 0) < now)
    .sort((a, b) => new Date(b.events?.start_date || 0).getTime() - new Date(a.events?.start_date || 0).getTime());

  return (
    <div className="wallet-page" style={{ minHeight: '100vh', padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      

      {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading your tickets...</p> : (
        <>
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '16px' }}>Your wallet is completely empty.</p>
              <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Find an Event</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
              {upcomingTickets.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>Upcoming Events</h2>
                  {renderTicketList(upcomingTickets)}
                </div>
              )}
              {pastTickets.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Past Events</h2>
                  <div style={{ opacity: 0.7 }}>
                    {renderTicketList(pastTickets)}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Resale Modal Overlay */}
      <Modal isOpen={!!resellTicket} onClose={() => setResellTicket(null)} title="List for Resale" maxWidth="400px">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Selling ticket for <strong>{resellTicket?.events?.name}</strong>.
        </p>
        <form onSubmit={handleListForResale} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Asking Price (€)</label>
            <input 
              required 
              type="number" 
              step="0.01" 
              min="1" 
              max={resellTicket ? (resellTicket.price_paid_cents * 1.10 / 100).toFixed(2) : undefined}
              className="input-field" 
              value={askingPrice} 
              onChange={e => setAskingPrice(e.target.value)} 
              placeholder={`Max €${resellTicket ? (resellTicket.price_paid_cents * 1.10 / 100).toFixed(2) : ''}`} 
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Maximum allowed resale price (10% cap): €{resellTicket ? (resellTicket.price_paid_cents * 1.10 / 100).toFixed(2) : '0.00'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={() => setResellTicket(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={listingLoading} className="btn-primary" style={{ flex: 1 }}>
              {listingLoading ? 'Listing...' : 'Confirm Listing'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
