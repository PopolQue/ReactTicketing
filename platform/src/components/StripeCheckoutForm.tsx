import { useLanguage } from "../contexts/LanguageContext";
import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import Modal from './Modal';
interface StripeCheckoutFormProps {
  amountCents: number;
  itemName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}
export default function StripeCheckoutForm({
  amountCents,
  itemName,
  onConfirm,
  onCancel
}: StripeCheckoutFormProps) {
  const {
    t
  } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }
    setLoading(true);
    setError(null);
    const {
      error: submitError
    } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An error occurred.');
      setLoading(false);
      return;
    }
    const {
      error: confirmError,
      paymentIntent
    } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required' // We handle the result without redirecting if possible
    });
    if (confirmError) {
      setError(confirmError.message || 'Payment failed.');
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      await onConfirm();
      setLoading(false);
    } else {
      setError('Unexpected payment status.');
      setLoading(false);
    }
  };
  return <Modal isOpen={true} onClose={onCancel} title={t("secureCheckout")} maxWidth="400px">
      <div>
        <p style={{
        color: 'var(--text-secondary)',
        marginBottom: '24px'
      }}>{t("paymentFor")}<strong>{itemName}</strong>.
        </p>

        <div style={{
        padding: '16px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
          <span>{t("total")}</span>
          <strong style={{
          fontSize: '1.2rem',
          color: 'var(--accent)'
        }}>€{(amountCents / 100).toFixed(2)}</strong>
        </div>

        {error && <div style={{
        color: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '0.9rem'
      }}>
            {error}
          </div>}

        <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
          <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px'
        }}>
            {/* Stripe injects their iframe here, styling must be passed via Elements options but white bg helps with default stripe styles */}
            <PaymentElement />
          </div>

          <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px'
        }}>
            <button type="button" onClick={onCancel} className="btn-secondary" style={{
            flex: 1
          }} disabled={loading}>{t("cancel")}</button>
            <button type="submit" disabled={!stripe || loading} aria-disabled={!stripe || loading} className="btn-primary" style={{
            flex: 1,
            backgroundColor: '#10b981'
          }}>
              {loading ? t('store.checkout.processing') : `Pay €${(amountCents / 100).toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </Modal>;
}