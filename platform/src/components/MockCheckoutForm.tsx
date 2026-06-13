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

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = async () => {
    setPromoError('');
    if (!promoCode) return;
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('event_id', eventId)
      .eq('code', promoCode.toUpperCase())
      .eq('active', true)
      .single();
    
    if (error || !data) {
      setPromoError('Invalid or expired promo code');
    } else {
      setAppliedPromo(data);
    }
  };

  const getDiscountedAmount = () => {
    if (!appliedPromo) return amountCents;
    if (appliedPromo.discount_kind === 'percent_off') {
        return Math.max(0, amountCents - Math.round(amountCents * (appliedPromo.discount_value / 100)));
    } else if (appliedPromo.discount_kind === 'amount_off') {
        return Math.max(0, amountCents - appliedPromo.discount_value);
    } else if (appliedPromo.discount_kind === 'free') {
        return 0;
    }
    return amountCents;
  };

  const finalAmountCents = getDiscountedAmount();

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
    await onConfirm(appliedPromo);
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px', backgroundColor: 'rgba(15, 17, 21, 0.95)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '8px' }}>Secure Checkout</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Payment for <strong>{itemName}</strong>.
        </p>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Promo Code" 
              className="input-field" 
              value={promoCode} 
              onChange={e => setPromoCode(e.target.value)} 
              disabled={!!appliedPromo}
            />
            <button 
              type="button" 
              onClick={appliedPromo ? () => { setAppliedPromo(null); setPromoCode(''); } : handleApplyPromo}
              className="btn-secondary"
            >
              {appliedPromo ? 'Remove' : 'Apply'}
            </button>
          </div>
          {promoError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px' }}>{promoError}</p>}
        </div>

        <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Subtotal</span>
            <span>€{(amountCents / 100).toFixed(2)}</span>
          </div>
          {appliedPromo && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
              <span>Discount ({appliedPromo.code})</span>
              <span>-€{((amountCents - finalAmountCents) / 100).toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
            <button type="submit" disabled={loading || cardNumber.length < 14} className="btn-primary" style={{ flex: 1, backgroundColor: '#10b981' }}>
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
