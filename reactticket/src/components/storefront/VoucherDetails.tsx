import React from 'react';
import { useVoucher } from '../../hooks/useVoucher';
import { useCart } from '../../hooks/useCart'; // for totals
import { formatCurrency } from 'reactticket-core/utils/formatCurrency';
import { useI18n } from '../../context/I18nContext';
import { useReactTicket } from '../../hooks/useReactTicket';

export const VoucherDetails: React.FC = () => {
  const { promoDetails, removeVoucher } = useVoucher();
  const { totals } = useCart();
  const { ticketTypes } = useReactTicket();
  const { t, locale } = useI18n();

  if (!promoDetails) {
    return null;
  }

  const firstPaidType = ticketTypes.find(t => t.pricing.kind === 'paid') as any;
  const currency = firstPaidType ? firstPaidType.pricing.currency : 'USD';

  const renderDiscount = () => {
    if (!promoDetails || !promoDetails.discount) return 'N/A';
    if (promoDetails.discount.kind === 'percent_off') {
      return `${promoDetails.discount.percent || 0}% off`;
    }
    if (promoDetails.discount.kind === 'amount_off') {
      return `${formatCurrency(promoDetails.discount.amountCents || 0, currency, locale)} off`;
    }
    if (promoDetails.discount.kind === 'free') {
      return t('store.ticket.free');
    }
    return 'Discount applied';
  };

  return (
    <div className="voucher-details">
      <h4>Voucher Applied</h4>
      <p>
        <strong>{promoDetails.code}</strong> - <span>{renderDiscount()}</span>
      </p>
      <p>Discount: {formatCurrency(totals.discountCents, currency, locale)}</p>
      <button onClick={removeVoucher}>Remove</button>
    </div>
  );
};
