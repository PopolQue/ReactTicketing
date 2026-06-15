import React, { useState } from 'react';
import { useVoucher } from '../../hooks/useVoucher';
import { useI18n } from '../../context/I18nContext';

export const VoucherInput: React.FC = () => {
  const [code, setCode] = useState('');
  const { applyVoucher, isLoading, error } = useVoucher();
  const { t } = useI18n();

  const handleApply = async () => {
    if (!code) return;
    const success = await applyVoucher(code);
    if (success) {
        setCode('');
    }
  };

  return (
    <div className="voucher-input">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t('store.voucher.label')}
        aria-label={t('store.voucher.label')}
        disabled={isLoading}
      />
      <button onClick={handleApply} disabled={isLoading || !code} aria-busy={isLoading} aria-label={isLoading ? t('store.voucher.applying') : t('store.voucher.apply')}>
        {isLoading ? t('store.voucher.applying') : t('store.voucher.apply')}
      </button>
      {error && <p className="error-message" role="alert">{error}</p>}
    </div>
  );
};
