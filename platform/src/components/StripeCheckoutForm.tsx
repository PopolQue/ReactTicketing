import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

interface StripeCheckoutFormProps {
  amountCents: number;
  itemName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function StripeCheckoutForm({ amountCents, itemName, onConfirm, onCancel }: StripeCheckoutFormProps) {
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

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An error occurred.');
      setLoading(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
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

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px', backgroundColor: 'rgba(15, 17, 21, 0.95)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '8px' }}>Secure Checkout</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Payment for <strong>{itemName}</strong>.
        </p>

        <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Total</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>€{(amountCents / 100).toFixed(2)}</strong>
        </div>

        {error && (
          <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>
            {/* Stripe injects their iframe here, styling must be passed via Elements options but white bg helps with default stripe styles */}
            <PaymentElement />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex: 1 }} disabled={loading}>Cancel</button>
            <button type="submit" disabled={!stripe || loading} className="btn-primary" style={{ flex: 1, backgroundColor: '#10b981' }}>
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
