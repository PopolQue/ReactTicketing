import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from '../../lib/supabase';
import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';
import CheckoutModal from '../../components/CheckoutModal';
import { usePromoCode } from '../../hooks/usePromoCode';
import { useCheckout } from '../../hooks/useCheckout';
import TicketPersonalizationForm from './TicketPersonalizationForm';
import CheckoutSummary from './CheckoutSummary';
import { usePostHog } from '@posthog/react';
export default function CheckoutFlow({
  event,
  tiers,
  cart,
  onCancel,
  onComplete
}: {
  event: any;
  tiers: any[];
  cart: {
    [tierId: string]: number;
  };
  onCancel: () => void;
  onComplete: () => void;
}) {
  const {
    t
  } = useLanguage();
  const {
    showToast
  } = useToast();
  const posthog = usePostHog();
  const [currentStep, setCurrentStep] = useState(0); // 0 = Forms, 1 = Review & Pay
  const [user, setUser] = useState<any>(null);
  const [guestEmail, setGuestEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const {
    loading,
    checkoutFields,
    ticketForms,
    subtotalCents,
    handleAnswerChange,
    validateForms,
    executePurchase
  } = useCheckout({
    eventId: event.id,
    tiers,
    cart,
    guestEmail: user ? undefined : guestEmail // Only pass guest email if not logged in
  });
  const {
    promoCode,
    setPromoCode,
    appliedPromo,
    promoError,
    applyPromo,
    removePromo,
    getDiscountedAmount,
    incrementUsage
  } = usePromoCode(event.id);
  const finalTotalCents = getDiscountedAmount(subtotalCents);
  const handleProceedToPay = () => {
    if (!validateForms()) {
      showToast(`Please fill out all required fields for all tickets.`, 'error');
      return;
    }
    posthog?.capture('checkout_step_completed', {
      event_id: event.id,
      event_name: event.name,
      ticket_count: ticketForms.length,
      subtotal_cents: subtotalCents,
      final_total_cents: finalTotalCents,
      promo_applied: !!appliedPromo,
    });
    setCurrentStep(1);
  };
  const handlePurchaseExecution = () => {
    executePurchase({
      finalTotalCents,
      onSuccess: () => {
        posthog?.capture('order_completed', {
          event_id: event.id,
          event_name: event.name,
          ticket_count: ticketForms.length,
          total_cents: finalTotalCents,
          promo_applied: !!appliedPromo,
          is_free: finalTotalCents === 0,
        });
        showToast('Tickets purchased successfully! View them in your wallet.', 'success');
        onComplete();
      },
      onError: err => {
        showToast("Error purchasing tickets: " + err.message, 'error');
      },
      onBeforeComplete: incrementUsage
    });
  };
  if (loading) return <div style={{
    padding: '40px',
    textAlign: 'center'
  }}>{t("preparingYourCheckout")}</div>;
  if (currentStep === 1) {
    if (finalTotalCents === 0) {
      return <div className="glass-panel" style={{
        padding: '40px',
        textAlign: 'center'
      }}>
          <h2>{t("freeOrder")}</h2>
          <p style={{
          color: 'var(--text-secondary)',
          marginBottom: '24px'
        }}>{t("yourTotalIs000NoPaymen")}</p>
          <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
            <button onClick={() => setCurrentStep(0)} className="btn-secondary">{t("goBack")}</button>
            <button onClick={handlePurchaseExecution} className="btn-primary" style={{
            backgroundColor: '#10b981'
          }}>{t("completeOrder")}</button>
          </div>
        </div>;
    }
    return <CheckoutModal eventId={event.id} amountCents={finalTotalCents} itemName={`${ticketForms.length}x Tickets`} onConfirm={handlePurchaseExecution} onCancel={() => setCurrentStep(0)} />;
  }
  return <div style={{
    padding: '24px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid var(--border)'
  }}>
      <h2 style={{
      marginBottom: '24px'
    }}>{t("checkout")}</h2>

      <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '32px'
    }}>
        <div>
          <h3 style={{
          marginBottom: '16px'
        }}>{t("ticketDetails")}</h3>
          {ticketForms.map((t, index) => <TicketPersonalizationForm key={t.id} ticketForm={t} index={index} checkoutFields={checkoutFields} onAnswerChange={handleAnswerChange} />)}
        </div>

        <div>
          <CheckoutSummary ticketForms={ticketForms} subtotalCents={subtotalCents} finalTotalCents={finalTotalCents} promoCode={promoCode} setPromoCode={setPromoCode} appliedPromo={appliedPromo} promoError={promoError} onApplyPromo={applyPromo} onRemovePromo={removePromo} onCancel={onCancel} onProceed={handleProceedToPay} />
          {!user && (
            <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                Guest Checkout
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Enter your email to receive your tickets. You can claim them to an account later.
              </p>
              <input
                required
                type="email"
                className="input-field"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                placeholder="Your email address"
              />
            </div>
          )}
        </div>
      </div>
    </div>;
}