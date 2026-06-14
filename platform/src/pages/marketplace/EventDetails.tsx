import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import EventHero from '../../features/marketplace/EventHero';
import EventAboutSection from '../../features/marketplace/EventAboutSection';
import { useEventData } from '../../hooks/useEventData';
import { SupabaseAdapter } from '../../lib/Admit/SupabaseAdapter';
import CheckoutModal from '../../components/CheckoutModal';

const ReactTicket = React.lazy(() => import('reactticket').then(m => ({ default: m.ReactTicket })));

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { event, tiers, eventArtists, loading } = useEventData(id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Adapter initialization
  const adapter = useMemo(() => new SupabaseAdapter(supabase), []);

  const [checkoutOrder, setCheckoutOrder] = useState<any | null>(null);
  const [checkoutResolve, setCheckoutResolve] = useState<((result: "confirmed" | "cancelled") => void) | null>(null);

  const handleCheckout = async (order: any): Promise<"confirmed" | "cancelled"> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('Please log in or sign up to purchase tickets.', 'error');
      navigate('/auth');
      return "cancelled";
    }
    
    return new Promise((resolve) => {
      setCheckoutOrder(order);
      setCheckoutResolve(() => resolve);
    });
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>;
  if (!event) return <div style={{ padding: '60px', textAlign: 'center' }}>Event not found.</div>;

  const theme = event.theme_customization || {};
  const customBgColor = theme.bgColor || 'var(--bg-color)';
  const customAccentColor = theme.accentColor || 'var(--accent)';
  const images = event.images || [];

  return (
    <div className="event-details-page" style={{ minHeight: '100vh', backgroundColor: customBgColor, transition: 'background-color 0.5s' }}>
      
      {checkoutOrder && checkoutResolve && (
        <CheckoutModal
          eventId={event.id}
          amountCents={checkoutOrder.totalCents}
          itemName={`Order for ${event.name}`}
          onConfirm={async () => {
            checkoutResolve("confirmed");
            setCheckoutOrder(null);
            setCheckoutResolve(null);
            showToast('Order confirmed! Tickets issued.', 'success');
            navigate('/wallet');
          }}
          onCancel={() => {
            checkoutResolve("cancelled");
            setCheckoutOrder(null);
            setCheckoutResolve(null);
          }}
        />
      )}
      

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

          <div className="react-ticket-container" style={{ '--rt-bg': customBgColor, '--rt-accent': customAccentColor } as any}>
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>Loading tickets...</div>}>
              {typeof window !== 'undefined' ? (
                <ReactTicket
                  mode="storefront"
                  event={event}
                  adapter={adapter}
                  onCheckout={handleCheckout}
                  theme={theme}
                />
              ) : (
                <div style={{ padding: '24px', textAlign: 'center' }}>Loading tickets...</div>
              )}
            </React.Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
