import { useLanguage } from "../contexts/LanguageContext";
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import MockCheckoutForm from './MockCheckoutForm';
import StripeCheckoutForm from './StripeCheckoutForm';
import Modal from './Modal';

// Initialize stripe conditionally based on the environment variable
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;
interface CheckoutModalProps {
  eventId: string;
  amountCents: number;
  itemName: string;
  onConfirm: (promoCodeObj?: any) => Promise<void>;
  onCancel: () => void;
}
export default function CheckoutModal({
  eventId,
  amountCents,
  itemName,
  onConfirm,
  onCancel
}: CheckoutModalProps) {
  const {
    t
  } = useLanguage();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!stripeKey) {
      setLoading(false);
      return;
    }

    // If we have a Stripe key, fetch a PaymentIntent from our backend
    async function fetchIntent() {
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amountCents,
            itemName
          })
        });
        if (!res.ok) {
          throw new Error('Failed to initialize payment.');
        }
        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchIntent();
  }, [amountCents, itemName]);
  if (!stripeKey) {
    return <MockCheckoutForm eventId={eventId} amountCents={amountCents} itemName={itemName} onConfirm={onConfirm} onCancel={onCancel} />;
  }
  if (loading) {
    return <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
        <p role="status" aria-live="polite">{t("loadingSecureCheckout")}</p>
      </div>;
  }
  if (error || !clientSecret) {
    return <Modal isOpen={true} onClose={onCancel} title={t("checkoutError")} maxWidth="400px">
        <div style={{
        textAlign: 'center'
      }}>
          <p style={{
          color: '#ef4444',
          marginBottom: '16px'
        }}>{error || 'Could not connect to payment gateway.'}</p>
          <button onClick={onCancel} className="btn-secondary">{t("goBack")}</button>
        </div>
      </Modal>;
  }
  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#10b981',
        colorBackground: '#1f2937',
        colorText: '#ffffff'
      }
    }
  };
  return <Elements stripe={stripePromise} options={options}>
      <StripeCheckoutForm amountCents={amountCents} itemName={itemName} onConfirm={onConfirm} onCancel={onCancel} />
    </Elements>;
}