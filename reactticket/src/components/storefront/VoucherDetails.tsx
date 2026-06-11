import React from 'react';
import { useVoucher } from '../../hooks/useVoucher';
import { useCart } from '../../hooks/useCart'; // for totals
import { formatCurrency } from '../../utils/formatCurrency';

export const VoucherDetails: React.FC = () => {
  const { promoDetails, removeVoucher } = useVoucher();
  const { totals } = useCart();

  if (!promoDetails) {
    return null;
  }

  const renderDiscount = () => {
    if (!promoDetails || !promoDetails.discount) return 'N/A';
    if (promoDetails.discount.kind === 'percent_off') {
      return `${promoDetails.discount.percent || 0}% off`;
    }
    if (promoDetails.discount.kind === 'amount_off') {
      return `${formatCurrency(promoDetails.discount.amountCents || 0, 'EUR')} off`;
    }
    if (promoDetails.discount.kind === 'free') {
      return 'Free';
    }
    return 'Discount applied';
  };

  return (
    <div className="voucher-details">
      <h4>Voucher Applied</h4>
      <p>
        <strong>{promoDetails.code}</strong> - <span>{renderDiscount()}</span>
      </p>
      <p>Discount: {totals.discount}</p>
      <button onClick={removeVoucher}>Remove</button>
    </div>
  );
};
