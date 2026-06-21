import React, { useState } from 'react';
import { useVoucher } from '../../hooks/useVoucher';
import { useI18n } from '../../context/I18nContext';

export const PromoCodeInput = () => {
  const [code, setCode] = useState('');
  const { applyVoucher } = useVoucher();
  const { t } = useI18n();

  const handleApply = async () => {
    await applyVoucher(code);
  };

  return (
    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
      <input
        placeholder={t('store.promo.label')}
        aria-label={t('store.promo.label')}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
      />
      <button
        onClick={handleApply}
        aria-label={t('store.promo.apply')}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          background: '#e2e8f0',
          cursor: 'pointer',
        }}
      >
        {t('store.promo.apply')}
      </button>
    </div>
  );
};
