import React from 'react';
import { useCart } from '../../hooks/useCart';
import { useVoucher } from '../../hooks/useVoucher';
import { useReactTicket } from '../../hooks/useReactTicket';
import { useI18n } from '../../context/I18nContext';
import { formatCurrency } from 'reactticket-core/utils/formatCurrency';
import { VoucherInput } from './VoucherInput';
import { VoucherDetails } from './VoucherDetails';

export const Cart: React.FC = () => {
  const { items, removeItem, totals } = useCart();
  const { promoDetails } = useVoucher();
  const { ticketTypes } = useReactTicket();
  const { t, locale } = useI18n();

  if (items.length === 0) return null;

  const firstPaidType = ticketTypes.find(t => t.pricing.kind === 'paid') as any;
  const currency = firstPaidType ? firstPaidType.pricing.currency : 'USD';

  return (
    <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
      <h3>{t('store.cart.title')}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label={t('store.cart.title')}>
        <tbody>
          {items.map(item => {
            const type = ticketTypes.find(t => t.id === item.ticketTypeId);
            return (
              <tr key={item.ticketTypeId}>
                <td style={{ padding: '8px' }}>{type?.name || 'Unknown'}</td>
                <td style={{ padding: '8px' }}>x{item.quantity}</td>
                <td style={{ padding: '8px' }}>
                  <button 
                    type="button"
                    onClick={() => removeItem(item.ticketTypeId)} 
                    style={{ color: 'red' }}
                    aria-label={`Remove ${type?.name || 'Unknown'} from cart`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: '20px' }}>
        {promoDetails ? <VoucherDetails /> : <VoucherInput />}
      </div>
      <div style={{ marginTop: '10px', textAlign: 'right' }}>
        <p>{t('store.cart.subtotal')}: {formatCurrency(totals.subtotalCents, currency, locale)}</p>
        {promoDetails && <p>{t('store.cart.discount')}: -{formatCurrency(totals.discountCents, currency, locale)}</p>}
        <strong>{t('store.cart.total')}: {formatCurrency(totals.totalCents, currency, locale)}</strong>
      </div>
    </div>
  );
};
