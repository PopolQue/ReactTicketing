import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import CheckoutModal from '../../components/CheckoutModal';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<any[]>([]);
  const [eventArtists, setEventArtists] = useState<any[]>([]);

  // Carousel & Checkout state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkoutTier, setCheckoutTier] = useState<any>(null);

  useEffect(() => {
    async function fetchEventDetails() {
      const { data, error } = await supabase
        .from('events')
        .select(`*, organizer_profiles(company_name)`)
        .eq('id', id)
        .single();

      if (data) {
        setEvent(data);
        document.title = `${data.name} | Admit`; // SEO Meta Title injection
      }

      const { data: tiersData } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', id);

      if (tiersData) setTiers(tiersData);

      const { data: artistsData } = await supabase
        .from('event_artists')
        .select('*, artists(*)')
        .eq('event_id', id);
        
      if (artistsData) setEventArtists(artistsData);

      setLoading(false);
    }

    fetchEventDetails();
    return () => { document.title = 'Admit'; }
  }, [id]);

  const initCheckout = async (tier: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('Please log in or sign up to purchase a ticket.', 'error');
      navigate('/auth');
      return;
    }
    setCheckoutTier(tier);
  };

  const executePurchase = async () => {
    if (!checkoutTier) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const orderId = crypto.randomUUID();
      const priceCents = checkoutTier.pricing?.amount || 0;

      const { error: orderError } = await supabase.from('orders').insert([{
        id: orderId,
        event_id: event.id,
        items: [{ ticket_type_id: checkoutTier.id, quantity: 1, price_cents: priceCents }],
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
        ticket_type_id: checkoutTier.id,
        order_id: orderId,
        personalization: { name: user.email },
        buyer_email: user.email,
        status: 'valid',
        qr_payload: `ticketeer_${crypto.randomUUID()}`,
        price_paid_cents: priceCents,
        owner_id: user.id
      }]);

      if (ticketError) throw ticketError;

      showToast('Ticket purchased successfully! View it in your wallet.', 'success');
      navigate('/wallet');
    } catch (err: any) {
      showToast("Error purchasing ticket: " + err.message, 'error');
      setCheckoutTier(null);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>;
  if (!event) return <div style={{ padding: '60px', textAlign: 'center' }}>Event not found.</div>;

  const theme = event.theme_customization || {};
  const customBgColor = theme.bgColor || 'var(--bg-color)';
  const customAccentColor = theme.accentColor || 'var(--accent)';
  const images = event.images || [];

  return (
    <div className="event-details-page" style={{ minHeight: '100vh', backgroundColor: customBgColor, transition: 'background-color 0.5s' }}>
      <header style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>← Back to Marketplace</Link>
      </header>

      {images.length > 0 && (
        <div style={{ width: '100%', height: '400px', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
          <img
            src={images[currentImageIndex]}
            alt="Event"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
          />
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {images.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  style={{
                    width: '12px', height: '12px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                    backgroundColor: idx === currentImageIndex ? customAccentColor : 'rgba(255,255,255,0.4)'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <main style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', position: 'relative', top: images.length > 0 ? '-60px' : '0' }}>
        <div className="glass-panel" style={{ padding: '40px', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 16px 0' }}>{event.name}</h1>
          <p style={{ color: customAccentColor, fontSize: '1.2rem', margin: '0 0 24px 0', fontWeight: 600 }}>
            Presented by {event.organizer_profiles?.company_name || 'Independent Organizer'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px', padding: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.6)' }}>Date & Time</p>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{new Date(event.start_date).toLocaleString()}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.6)' }}>Venue</p>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{event.venue}</p>
              {(event.city || event.country) && (
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  {event.city}{event.city && event.country ? ', ' : ''}{event.country}
                </p>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ marginBottom: '16px' }}>About this event</h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {event.description}
            </p>
          </div>

          {eventArtists.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ marginBottom: '16px' }}>Lineup</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {eventArtists.map((ea: any) => (
                  <div key={ea.artist_id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: customAccentColor }}>{ea.artists?.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>{ea.stage_name || 'Main Stage'}</p>
                    {ea.artists?.bio && (
                       <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ea.artists.bio}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '32px' }}>
            <h3 style={{ marginBottom: '24px' }}>Tickets</h3>
            {event.is_external ? (
              <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '1.4rem' }}>Tickets available on external platform</h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>This event is hosted by {event.organizer_profiles?.company_name || 'an independent organizer'} and tickets are sold externally.</p>
                {event.external_ticket_url ? (
                  <a href={event.external_ticket_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ backgroundColor: customAccentColor, display: 'inline-block', textDecoration: 'none', padding: '14px 32px', fontSize: '1.1rem' }}>
                    Get Tickets Now ↗
                  </a>
                ) : (
                  <p style={{ color: '#ef4444' }}>Ticket link is currently unavailable.</p>
                )}
              </div>
            ) : tiers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>The organizer hasn't set up ticket tiers yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {tiers.map(tier => (
                  <div key={tier.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{tier.name}</h4>
                      <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.9rem' }}>Capacity: {tier.capacity}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'white' }}>
                        €{((tier.pricing?.amount || 0) / 100).toFixed(2)}
                      </div>
                      <button
                        onClick={() => initCheckout(tier)}
                        className="btn-primary"
                        style={{ backgroundColor: customAccentColor }}
                      >
                        Buy Ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {checkoutTier && (
        <CheckoutModal
          amountCents={checkoutTier.pricing?.amount || 0}
          itemName={`${event.name} - ${checkoutTier.name}`}
          onConfirm={executePurchase}
          onCancel={() => setCheckoutTier(null)}
        />
      )}
    </div>
  );
}
