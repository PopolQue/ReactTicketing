import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';

export const PromoCodeInput = () => {
  const [code, setCode] = useState('');
  const { setPromoCode } = useCart();

  const handleApply = async () => {
    await setPromoCode(code);
  };

  return (
    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
      <input 
        placeholder="Enter promo code" 
        value={code} 
        onChange={e => setCode(e.target.value)}
        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
      />
      <button 
        onClick={handleApply}
        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#e2e8f0', cursor: 'pointer' }}
      >
        Apply
      </button>
    </div>
  );
};
