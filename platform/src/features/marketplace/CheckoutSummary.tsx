import React from 'react';

export default function CheckoutSummary({
  ticketForms,
  subtotalCents,
  finalTotalCents,
  promoCode,
  setPromoCode,
  appliedPromo,
  promoError,
  onApplyPromo,
  onRemovePromo,
  onCancel,
  onProceed
}: {
  ticketForms: any[];
  subtotalCents: number;
  finalTotalCents: number;
  promoCode: string;
  setPromoCode: (code: string) => void;
  appliedPromo: any;
  promoError: string;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
  onCancel: () => void;
  onProceed: () => void;
}) {
  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
      <h3 style={{ marginBottom: '16px' }}>Order Summary</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {ticketForms.map((t, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span>{t.tier.name}</span>
            <span>€{((t.tier.pricing?.amount || 0) / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Promo Code</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            className="input-field" 
            value={promoCode}
            onChange={e => setPromoCode(e.target.value)}
            disabled={!!appliedPromo}
            placeholder="CODE"
          />
          <button type="button" onClick={appliedPromo ? onRemovePromo : onApplyPromo} className="btn-secondary">
            {appliedPromo ? 'Remove' : 'Apply'}
          </button>
        </div>
        {promoError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{promoError}</p>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>Subtotal</span>
          <span>€{(subtotalCents / 100).toFixed(2)}</span>
        </div>
        {appliedPromo && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
            <span>Discount ({appliedPromo.code})</span>
            <span>-€{((subtotalCents - finalTotalCents) / 100).toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '1.2rem', fontWeight: 600 }}>
          <span>Total</span>
          <span style={{ color: 'var(--accent)' }}>€{(finalTotalCents / 100).toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
        <button onClick={onProceed} className="btn-primary" style={{ flex: 2, backgroundColor: '#10b981' }}>
          {finalTotalCents === 0 ? 'Complete Order' : 'Proceed to Payment'}
        </button>
      </div>
    </div>
  );
}
