import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import CheckoutModal from '../../components/CheckoutModal';

export default function ResaleMarket() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [checkoutListing, setCheckoutListing] = useState<any>(null);

  useEffect(() => {
    fetchListings();
    document.title = 'Secondary Market | Ticketeer';
  }, []);

  async function fetchListings() {
    const { data, error } = await supabase
      .from('resale_listings')
      .select(`
        *,
        tickets (
          *,
          events ( name, start_date, venue ),
          ticket_types ( name )
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setListings(data);
    setLoading(false);
  }

  const initBuyTicket = async (listing: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Please log in to purchase secondary market tickets.", 'error');
      navigate('/auth');
      return;
    }

    if (user.id === listing.seller_id) {
      showToast("You cannot buy your own ticket!", 'error');
      return;
    }

    setCheckoutListing(listing);
  };

  const executePurchase = async () => {
    if (!checkoutListing) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('buy_resale_ticket', {
        p_listing_id: checkoutListing.id,
        p_buyer_id: user.id
      });

      if (error) throw error;

      showToast("Ticket successfully purchased and transferred to your wallet!", 'success');
      navigate('/wallet');
    } catch (err: any) {
      showToast("Purchase failed: " + err.message, 'error');
      setCheckoutListing(null);
    }
  };

  return (
    <div className="resale-market-page" style={{ minHeight: '100vh', padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '40px', gap: '16px', alignItems: 'center' }}>
        <div>
           <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Secondary Market</h1>
           <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0' }}>Securely buy tickets from other fans.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none' }}>Primary Market</Link>
          <Link to="/wallet" className="btn-secondary" style={{ textDecoration: 'none' }}>My Wallet</Link>
        </div>
      </header>

      {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading listings...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
          {listings.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>No tickets are currently listed for resale.</p>
            </div>
          ) : (
            listings.map(listing => (
              <div key={listing.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>{listing.tickets?.events?.name}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(listing.tickets?.events?.start_date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {listing.tickets?.events?.venue}
                  </p>
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
            ))
          )}
        </div>
      )}

      {checkoutListing && (
        <CheckoutModal 
          amountCents={checkoutListing.asking_price_cents}
          itemName={`${checkoutListing.tickets?.events?.name} (Resale)`}
          onConfirm={executePurchase}
          onCancel={() => setCheckoutListing(null)}
        />
      )}
    </div>
  );
}
