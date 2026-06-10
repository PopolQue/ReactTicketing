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
        disabled={isLoading}
      />
      <button onClick={handleApply} disabled={isLoading || !code}>
        {isLoading ? 'Applying...' : 'Apply'}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};
