import React from 'react';
import { useCart } from '../../hooks/useCart';

export const OrderSummary = () => {
  const { totals } = useCart();
  return (
    <div style={{ marginTop: '20px', padding: '20px', borderTop: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Order Summary</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Subtotal:</span> <span>{totals.subtotal}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Discount:</span> <span>{totals.discount}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '10px', fontSize: '18px' }}>
        <span>Total:</span> <span>{totals.total}</span>
      </div>
    </div>
  );
};
