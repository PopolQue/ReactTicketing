import React from 'react';
import { useCart } from '../../hooks/useCart';

export const CheckoutButton = () => {
  const { checkout } = useCart();
  return (
    <button 
      onClick={checkout}
      style={{
        width: '100%', padding: '16px', borderRadius: '8px', border: 'none',
        background: '#0f172a', color: 'white', fontSize: '16px', fontWeight: 'bold',
        cursor: 'pointer', marginTop: '20px'
      }}
    >
      Complete Purchase
    </button>
  );
};
