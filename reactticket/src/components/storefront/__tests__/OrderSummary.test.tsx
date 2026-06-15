import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { OrderSummary } from '../OrderSummary';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';

afterEach(cleanup);

vi.mock('../../../hooks/useCart', () => ({
  useCart: vi.fn(() => ({
    totals: { subtotalCents: 2000, discountCents: 500, totalCents: 1500 }
  }))
}));

vi.mock('../../../context/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => {
        const translations: Record<string, string> = {
            'store.order.summary': 'Order Summary',
            'store.cart.subtotal': 'Subtotal',
            'store.cart.discount': 'Discount',
            'store.cart.total': 'Total'
        };
        return translations[key] || key;
    },
    locale: 'en-US'
  })
}));

describe('OrderSummary Component', () => {
  const mockContext = {
    event: { id: 'evt_1' },
    adapter: { name: 'memory' } as any,
    onCheckout: vi.fn(),
    ticketTypes: [
      { id: 't1', name: 'Standard', pricing: { kind: 'paid', priceInCents: 1000, currency: 'USD' } }
    ]
  } as any;

  it('renders correctly', () => {
    render(
      <ReactTicketProvider {...mockContext}>
        <OrderSummary />
      </ReactTicketProvider>
    );

    expect(screen.getByText('Order Summary')).toBeDefined();
    expect(screen.getByText('Subtotal:')).toBeDefined();
    // 2000 cents in USD is 20.00
    expect(screen.getByText('$20.00')).toBeDefined();
  });
});
