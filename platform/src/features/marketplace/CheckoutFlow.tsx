import React, { useState } from 'react';
import { useToast } from '../../components/Toast';
import CheckoutModal from '../../components/CheckoutModal';
import { usePromoCode } from '../../hooks/usePromoCode';
import { useCheckout } from '../../hooks/useCheckout';
import TicketPersonalizationForm from './TicketPersonalizationForm';
import CheckoutSummary from './CheckoutSummary';

export default function CheckoutFlow({
  event,
  tiers,
  cart,
  onCancel,
  onComplete
}: {
  event: any;
  tiers: any[];
  cart: { [tierId: string]: number };
  onCancel: () => void;
  onComplete: () => void;
}) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0); // 0 = Forms, 1 = Review & Pay

  const {
    loading,
    checkoutFields,
    ticketForms,
    subtotalCents,
    handleAnswerChange,
    validateForms,
    executePurchase
  } = useCheckout({ eventId: event.id, tiers, cart });

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
    setCurrentStep(1);
  };

  const handlePurchaseExecution = () => {
    executePurchase({
      finalTotalCents,
      onSuccess: () => {
        showToast('Tickets purchased successfully! View them in your wallet.', 'success');
        onComplete();
      },
      onError: (err) => {
        showToast("Error purchasing tickets: " + err.message, 'error');
      },
      onBeforeComplete: incrementUsage
    });
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Preparing your checkout...</div>;

  if (currentStep === 1) {
    if (finalTotalCents === 0) {
      return (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Free Order</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Your total is €0.00. No payment information is required.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setCurrentStep(0)} className="btn-secondary">Go Back</button>
            <button onClick={handlePurchaseExecution} className="btn-primary" style={{ backgroundColor: '#10b981' }}>Complete Order</button>
          </div>
        </div>
      );
    }
    return (
      <CheckoutModal
        eventId={event.id}
        amountCents={finalTotalCents}
        itemName={`${ticketForms.length}x Tickets`}
        onConfirm={handlePurchaseExecution}
        onCancel={() => setCurrentStep(0)}
      />
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h2 style={{ marginBottom: '24px' }}>Checkout</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        <div>
          <h3 style={{ marginBottom: '16px' }}>Ticket Details</h3>
          {ticketForms.map((t, index) => (
            <TicketPersonalizationForm
              key={t.id}
              ticketForm={t}
              index={index}
              checkoutFields={checkoutFields}
              onAnswerChange={handleAnswerChange}
            />
          ))}
        </div>

        <div>
          <CheckoutSummary
            ticketForms={ticketForms}
            subtotalCents={subtotalCents}
            finalTotalCents={finalTotalCents}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            appliedPromo={appliedPromo}
            promoError={promoError}
            onApplyPromo={applyPromo}
            onRemovePromo={removePromo}
            onCancel={onCancel}
            onProceed={handleProceedToPay}
          />
        </div>
      </div>
    </div>
  );
}
