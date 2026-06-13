import React from 'react';

export default function EventCheckoutBottomBar({
  cart,
  customAccentColor,
  onProceed
}: {
  cart: { [tierId: string]: number };
  customAccentColor: string;
  onProceed: () => void;
}) {
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  if (totalItems === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '24px', backgroundColor: 'rgba(15, 17, 21, 0.95)', borderTop: '1px solid var(--border)', zIndex: 100, display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '800px' }}>
        <div>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Selected Tickets</p>
          <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{totalItems} Items</p>
        </div>
        <button onClick={onProceed} className="btn-primary" style={{ padding: '12px 32px', fontSize: '1.1rem', backgroundColor: customAccentColor }}>
          Proceed to Checkout →
        </button>
      </div>
    </div>
  );
}
