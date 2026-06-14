import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface CheckoutModalProps {
  eventId: string;
  amountCents: number;
  itemName: string;
  onConfirm: (promoCodeObj?: any) => Promise<void>;
  onCancel: () => void;
}

export default function MockCheckoutForm({ eventId, amountCents, itemName, onConfirm, onCancel }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const finalAmountCents = amountCents;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i=0, len=match.length; i<len; i+=4) {
      parts.push(match.substring(i, i+4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay for Stripe processing
    await new Promise(r => setTimeout(r, 1500));
    await onConfirm();
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div className="glass-panel" role="dialog" aria-modal="true" aria-labelledby="checkout-title" style={{ padding: '40px', width: '100%', maxWidth: '400px', backgroundColor: 'rgba(15, 17, 21, 0.95)' }}>
        <h2 id="checkout-title" style={{ marginTop: 0, marginBottom: '8px' }}>Secure Checkout</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Payment for <strong>{itemName}</strong>.
        </p>

        <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px' }}>
            <strong>Total</strong>
            <strong style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>€{(finalAmountCents / 100).toFixed(2)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Card Number</label>
            <input 
              required 
              type="text" 
              maxLength={19}
              className="input-field" 
              value={cardNumber} 
              onChange={e => setCardNumber(formatCardNumber(e.target.value))} 
              placeholder="0000 0000 0000 0000" 
              style={{ letterSpacing: '2px', fontFamily: 'monospace' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Expiry Date</label>
              <input 
                required 
                type="text" 
                maxLength={5}
                className="input-field" 
                value={expiry} 
                onChange={e => setExpiry(formatExpiry(e.target.value))} 
                placeholder="MM/YY" 
                style={{ textAlign: 'center', fontFamily: 'monospace' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>CVC</label>
              <input 
                required 
                type="text" 
                maxLength={4}
                className="input-field" 
                value={cvc} 
                onChange={e => setCvc(e.target.value.replace(/\D/g, ''))} 
                placeholder="123" 
                style={{ textAlign: 'center', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button 
              type="submit" 
              disabled={loading || cardNumber.length < 14} 
              aria-disabled={loading || cardNumber.length < 14}
              className="btn-primary" 
              style={{ flex: 1, backgroundColor: '#10b981' }}
            >
              {loading ? 'Processing...' : `Pay €{(finalAmountCents / 100).toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
