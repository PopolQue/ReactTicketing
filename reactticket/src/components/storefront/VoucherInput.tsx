import React, { useState } from 'react';
import { useVoucher } from '../../hooks/useVoucher';

export const VoucherInput: React.FC = () => {
  const [code, setCode] = useState('');
  const { applyVoucher, isLoading, error } = useVoucher();

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
        placeholder="Enter voucher code"
        aria-label="Voucher code"
        disabled={isLoading}
      />
      <button onClick={handleApply} disabled={isLoading || !code} aria-busy={isLoading} aria-label={isLoading ? 'Applying voucher...' : 'Apply voucher'}>
        {isLoading ? 'Applying...' : 'Apply'}
      </button>
      {error && <p className="error-message" role="alert">{error}</p>}
    </div>
  );
};
