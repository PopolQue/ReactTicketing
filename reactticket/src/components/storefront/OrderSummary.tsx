import React from 'react';
import { useCart } from '../../hooks/useCart';
import { useI18n } from '../../context/I18nContext';
import { useReactTicket } from '../../hooks/useReactTicket';
import { formatCurrency } from 'reactticket-core/utils/formatCurrency';

export const OrderSummary = () => {
  const { totals } = useCart();
  const { ticketTypes } = useReactTicket();
  const { t, locale } = useI18n();

  const firstPaidType = ticketTypes.find(t => t.pricing.kind === 'paid') as any;
  const currency = firstPaidType ? firstPaidType.pricing.currency : 'USD';
  return (
    <div style={{ marginTop: '20px', padding: '20px', borderTop: '1px solid #e2e8f0' }} role="region" aria-label={t('store.order.summary')} aria-live="polite">
      <h3 style={{ margin: '0 0 10px 0' }}>{t('store.order.summary')}</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{t('store.cart.subtotal')}:</span> <span>{formatCurrency(totals.subtotalCents, currency, locale)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{t('store.cart.discount')}:</span> <span>-{formatCurrency(totals.discountCents, currency, locale)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '10px', fontSize: '18px' }}>
        <span>{t('store.cart.total')}:</span> <span>{formatCurrency(totals.totalCents, currency, locale)}</span>
      </div>
    </div>
  );
};
