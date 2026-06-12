import React, { useState } from 'react';

interface CheckoutModalProps {
  amountCents: number;
  itemName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function CheckoutModal({ amountCents, itemName, onConfirm, onCancel }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');

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
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px', backgroundColor: 'rgba(15, 17, 21, 0.95)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '8px' }}>Secure Checkout</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Payment for <strong>{itemName}</strong>.
        </p>

        <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Total</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>€{(amountCents / 100).toFixed(2)}</strong>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Card Number (Mock)</label>
            <input 
              required 
              type="text" 
              maxLength={16}
              className="input-field" 
              value={cardNumber} 
              onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))} 
              placeholder="4242 4242 4242 4242" 
            />
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
