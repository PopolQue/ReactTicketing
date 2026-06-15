import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Cart } from '../Cart';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';
import { useReactTicket } from '../../../hooks/useReactTicket';

vi.mock('../../hooks/useCart', () => ({
  useCart: () => ({
    items: [
        { ticketTypeId: 't1', quantity: 2 }
    ],
    removeItem: vi.fn(),
    totals: { subtotalCents: 2000, discountCents: 0, totalCents: 2000 }
  })
}));

vi.mock('../../hooks/useReactTicket', () => ({
    useReactTicket: () => ({
      ticketTypes: [
        { id: 't1', name: 'Standard', pricing: { kind: 'paid', priceInCents: 1000, currency: 'EUR' } }
      ],
      event: { id: 'evt_1' },
      adapter: {},
      cart: { items: [{ ticketTypeId: 't1', quantity: 2 }] }
    })
  }));

vi.mock('../../context/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en-US'
  })
}));

describe('Cart Component', () => {
  it('renders correctly with items', () => {
    render(
      <ReactTicketProvider event={{ id: 'evt_1' }} adapter={{ name: 'memory' } as any} onCheckout={vi.fn()}>
        <TestComponent />
      </ReactTicketProvider>
    );
    expect(screen.getByText('Standard')).toBeDefined();
    expect(screen.getByText('x2')).toBeDefined();
    expect(screen.getByText('Your Cart')).toBeDefined();
  });
});

const TestComponent = () => {
    const { dispatch } = useReactTicket();
    useEffect(() => {
        dispatch({ type: 'ADD_ITEM', payload: { ticketTypeId: 't1', quantity: 2 } });
        dispatch({ type: 'SET_TICKET_TYPES', payload: [{ id: 't1', name: 'Standard', pricing: { kind: 'paid', priceInCents: 1000, currency: 'EUR' } }] });
    }, [dispatch]);
    return <Cart />;
}
