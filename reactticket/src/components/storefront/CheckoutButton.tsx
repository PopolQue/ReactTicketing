import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useI18n } from '../../context/I18nContext';

export const CheckoutButton = () => {
  const { checkout } = useCart();
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsProcessing(true);
    await checkout();
    setIsProcessing(false);
  };

  return (
    <button 
      type="button"
      onClick={handleCheckout}
      disabled={isProcessing}
      aria-busy={isProcessing}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: '16px',
        border: 'none',
        background: isProcessing ? '#64748b' : '#0f172a',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: isProcessing ? 'not-allowed' : 'pointer',
        zIndex: 1000
      }}
    >
      {isProcessing ? t('store.checkout.processing') : t('store.checkout.button')}
    </button>
  );
};
