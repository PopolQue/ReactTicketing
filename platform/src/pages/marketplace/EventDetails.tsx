import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import EventHero from '../../features/marketplace/EventHero';
import PrimaryTicketSelector from '../../features/marketplace/PrimaryTicketSelector';
import CheckoutFlow from '../../features/marketplace/CheckoutFlow';
import EventAboutSection from '../../features/marketplace/EventAboutSection';
import EventCheckoutBottomBar from '../../features/marketplace/EventCheckoutBottomBar';
import { useEventData } from '../../hooks/useEventData';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { event, tiers, eventArtists, loading } = useEventData(id);

  // Carousel & Checkout state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Cart & Checkout State
  const [cart, setCart] = useState<{ [tierId: string]: number }>({});
  const [checkoutMode, setCheckoutMode] = useState(false);

  const updateCart = (tierId: string, delta: number) => {
    setCart(prev => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[tierId];
        return copy;
      }
      return { ...prev, [tierId]: next };
    });
  };

  const handleBeginCheckout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('Please log in or sign up to purchase tickets.', 'error');
      navigate('/auth');
      return;
    }
    setCheckoutMode(true);
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

          <EventAboutSection event={event} eventArtists={eventArtists} customAccentColor={customAccentColor} />

          {checkoutMode ? (
            <CheckoutFlow 
              event={event} 
              tiers={tiers} 
              cart={cart} 
              onCancel={() => setCheckoutMode(false)} 
              onComplete={() => navigate('/wallet')} 
            />
          ) : (
            <PrimaryTicketSelector 
              event={event} 
              tiers={tiers} 
              cart={cart}
              updateCart={updateCart}
              customAccentColor={customAccentColor} 
            />
          )}
        </div>
      </main>

      {!checkoutMode && (
        <EventCheckoutBottomBar 
          cart={cart} 
          customAccentColor={customAccentColor} 
          onProceed={handleBeginCheckout} 
        />
      )}
    </div>
  );
}
