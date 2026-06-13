import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import CheckoutModal from '../../components/CheckoutModal';
import EventHero from '../../features/marketplace/EventHero';
import PrimaryTicketSelector from '../../features/marketplace/PrimaryTicketSelector';

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

  const executePurchase = async (promoCodeObj?: any) => {
    if (!checkoutTier) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const orderId = crypto.randomUUID();
      const subtotalCents = checkoutTier.pricing?.amount || 0;
      let discountCents = 0;
      let finalTotalCents = subtotalCents;

      if (promoCodeObj) {
        if (promoCodeObj.discount_kind === 'percent_off') {
            discountCents = Math.round(subtotalCents * (promoCodeObj.discount_value / 100));
        } else if (promoCodeObj.discount_kind === 'amount_off') {
            discountCents = promoCodeObj.discount_value;
        } else if (promoCodeObj.discount_kind === 'free') {
            discountCents = subtotalCents;
        }
        finalTotalCents = Math.max(0, subtotalCents - discountCents);
      }

      const { error: orderError } = await supabase.from('orders').insert([{
        id: orderId,
        event_id: event.id,
        items: [{ ticket_type_id: checkoutTier.id, quantity: 1, price_cents: subtotalCents }],
        buyer_email: user.email,
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        total_cents: finalTotalCents,
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
        price_paid_cents: finalTotalCents,
        owner_id: user.id
      }]);

      if (ticketError) throw ticketError;

      if (promoCodeObj) {
          // Increment promo usage (Migration 005 uses RPC, or just update directly for MVP)
          await supabase.rpc('increment_promo_usage', { p_code: promoCodeObj.code, p_event_id: event.id }).catch(() => {});
      }

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
        <Link to="/discover" className="btn-nav" style={{ padding: '8px 0', color: 'rgba(255,255,255,0.7)' }}>← Back to Marketplace</Link>
      </header>

      <EventHero 
        event={event} 
        images={images} 
        currentImageIndex={currentImageIndex} 
        setCurrentImageIndex={setCurrentImageIndex} 
        customAccentColor={customAccentColor} 
      />

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

          <PrimaryTicketSelector 
            event={event} 
            tiers={tiers} 
            initCheckout={initCheckout} 
            customAccentColor={customAccentColor} 
          />
        </div>
      </main>

      {checkoutTier && (
        <CheckoutModal
          eventId={event.id}
          amountCents={checkoutTier.pricing?.amount || 0}
          itemName={`${event.name} - ${checkoutTier.name}`}
          onConfirm={executePurchase}
          onCancel={() => setCheckoutTier(null)}
        />
      )}
    </div>
  );
}
