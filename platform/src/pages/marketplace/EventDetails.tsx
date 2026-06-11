import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [tiers, setTiers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEventDetails() {
      const { data, error } = await supabase
        .from('events')
        .select(`*, organizer_profiles(company_name)`)
        .eq('id', id)
        .single();
        
      if (data) setEvent(data);

      const { data: tiersData } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', id);
        
      if (tiersData) setTiers(tiersData);

      setLoading(false);
    }
    
    fetchEventDetails();
  }, [id]);

  const handleBuyTicket = async (tier: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in or sign up to purchase a ticket.');
      navigate('/auth');
      return;
    }
    
    setCheckoutLoading(true);
    try {
      const orderId = crypto.randomUUID();
      const priceCents = tier.pricing?.amount || 0;
      
      const { error: orderError } = await supabase.from('orders').insert([{
        id: orderId,
        event_id: event.id,
        items: [{ ticket_type_id: tier.id, quantity: 1, price_cents: priceCents }],
        buyer_email: user.email,
        subtotal_cents: priceCents,
        discount_cents: 0,
        total_cents: priceCents,
        status: 'completed'
      }]);
      
      if (orderError) throw orderError;
      
      const { error: ticketError } = await supabase.from('tickets').insert([{
        id: crypto.randomUUID(),
        event_id: event.id,
        ticket_type_id: tier.id,
        order_id: orderId,
        personalization: { name: user.email },
        buyer_email: user.email,
        status: 'valid',
        qr_payload: `ticketeer_${crypto.randomUUID()}`,
        price_paid_cents: priceCents,
        owner_id: user.id
      }]);

      if (ticketError) throw ticketError;
      
      navigate('/wallet');
    } catch (err: any) {
      alert("Error purchasing ticket: " + err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>;
  if (!event) return <div style={{ padding: '60px', textAlign: 'center' }}>Event not found.</div>;

  return (
    <div className="event-details-page" style={{ minHeight: '100vh' }}>
      <header style={{ padding: '24px 40px', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>← Back to Marketplace</Link>
      </header>

      <main style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '40px' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 16px 0' }}>{event.name}</h1>
          <p style={{ color: 'var(--accent)', fontSize: '1.2rem', margin: '0 0 24px 0', fontWeight: 600 }}>
            Presented by {event.organizer_profiles?.company_name || 'Independent Organizer'}
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px', padding: '24px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>Date & Time</p>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{new Date(event.start_date).toLocaleString()}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>Venue</p>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{event.venue}</p>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ marginBottom: '16px' }}>About this event</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {event.description}
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
            <h3 style={{ marginBottom: '24px' }}>Tickets</h3>
            {tiers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>The organizer hasn't set up ticket tiers yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {tiers.map(tier => (
                  <div key={tier.id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{tier.name}</h4>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Capacity: {tier.capacity}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'white' }}>
                        €{((tier.pricing?.amount || 0) / 100).toFixed(2)}
                      </div>
                      <button onClick={() => handleBuyTicket(tier)} disabled={checkoutLoading} className="btn-primary">
                        {checkoutLoading ? 'Processing...' : 'Buy Ticket'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
