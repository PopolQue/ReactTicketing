import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import EventHero from '../../features/marketplace/EventHero';
import EventAboutSection from '../../features/marketplace/EventAboutSection';
import { useEventData } from '../../hooks/useEventData';
import { SupabaseAdapter } from '../../lib/Admit/SupabaseAdapter';
import { mapEventToAdmitConfig } from '../../lib/Admit/mappers';
import CheckoutModal from '../../components/CheckoutModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { FollowButton } from '../../components/FollowButton';

const ReactTicket = React.lazy(() => import('reactticket').then(m => ({ default: m.ReactTicket })));

export default function EventDetails() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { event, tiers, eventArtists, loading } = useEventData(id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Adapter initialization
  const adapter = useMemo(() => new SupabaseAdapter(supabase), []);
  const admitConfig = useMemo(() => event ? mapEventToAdmitConfig(event) : null, [event]);

  const [checkoutOrder, setCheckoutOrder] = useState<any | null>(null);
  const [checkoutResolve, setCheckoutResolve] = useState<((result: "confirmed" | "cancelled") => void) | null>(null);

  const handleCheckout = async (order: any): Promise<"confirmed" | "cancelled"> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast(t('marketplace.eventDetails.loginToPurchase'), 'error');
      navigate('/auth');
      return "cancelled";
    }
    
    return new Promise((resolve) => {
      setCheckoutOrder(order);
      setCheckoutResolve(() => resolve);
    });
  };

  const handleTicketIssued = (ticket: any, assets: any) => {
    // Wiring to existing email handler (smoke test: PNG blob logged)
    console.log(`[Email Handler] Ticket issued: ${ticket.id}. Sending PNG blob to buyer ${ticket.buyerEmail}...`, assets);
    
    // Fire Marketing Pixels
    const pixels = event?.organizers?.marketing_pixels;
    if (pixels) {
      if (pixels.metaPixelId) console.log(`[Meta Pixel] Firing Purchase event to ID: ${pixels.metaPixelId}`);
      if (pixels.googleAnalyticsId) console.log(`[GA4] Firing purchase event to ID: ${pixels.googleAnalyticsId}`);
      if (pixels.tiktokPixelId) console.log(`[TikTok] Firing CompletePayment event to ID: ${pixels.tiktokPixelId}`);
    }
  };

  useEffect(() => {
    if (event) {
      // Record Page View
      supabase.from('page_views').insert([{
        event_id: event.id,
        organizer_id: event.organizer_id,
        user_agent: navigator.userAgent
      }]).then();
    }
  }, [event]);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>{t('marketplace.eventDetails.loading')}</div>;
  if (!event) return <div style={{ padding: '60px', textAlign: 'center' }}>{t('marketplace.eventDetails.notFound')}</div>;

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
            showToast(t('marketplace.eventDetails.orderConfirmed'), 'success');
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <p style={{ color: customAccentColor, fontSize: '1.2rem', margin: '0 0 24px 0', fontWeight: 600 }}>
                {t('marketplace.eventDetails.presentedBy')}{event.organizers?.name || t('marketplace.eventDetails.independentOrganizer')}
            </p>
            <FollowButton entityId={event.id} entityType="event" />
            {event.organizer_id && <FollowButton entityId={event.organizer_id} entityType="organizer" />}
          </div>

          <EventAboutSection event={event} eventArtists={eventArtists} customAccentColor={customAccentColor} />

          {event.is_external ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginTop: '32px' }}>
              <h3 style={{ marginBottom: '16px' }}>{t('marketplace.eventDetails.ticketsAvailableExternally')}</h3>
              {event.external_url ? (
                <a 
                  href={event.external_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-primary" 
                  style={{ display: 'inline-block', backgroundColor: customAccentColor, textDecoration: 'none' }}
                >
                  {t('marketplace.eventDetails.getTickets')}
                </a>
              ) : (
                <p>{t('marketplace.eventDetails.referToOrganizer')}</p>
              )}
            </div>
          ) : (
            <div className="react-ticket-container" style={{ '--rt-bg': customBgColor, '--rt-accent': customAccentColor } as any}>
              <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>{t('marketplace.eventDetails.loadingTickets')}</div>}>
                {typeof window !== 'undefined' && admitConfig ? (
                  <ReactTicket
                    mode="storefront"
                    event={admitConfig}
                    adapter={adapter}
                    onCheckout={handleCheckout}
                    onTicketIssued={handleTicketIssued}
                    theme={theme}
                  />
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center' }}>{t('marketplace.eventDetails.loadingTickets')}</div>
                )}
              </React.Suspense>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
