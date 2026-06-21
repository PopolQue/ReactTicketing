import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { TicketTypeList } from '../TicketTypeList';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';
import * as useReactTicketModule from '../../../hooks/useReactTicket';

afterEach(cleanup);

// Mock child components
vi.mock('../TicketTypeCard', () => ({
  TicketTypeCard: ({ type }: any) => <div data-testid="ticket-type-card">{type.name}</div>,
}));
vi.mock('../OrderSummary', () => ({ OrderSummary: () => <div data-testid="order-summary" /> }));
vi.mock('../PromoCodeInput', () => ({ PromoCodeInput: () => <div data-testid="promo-input" /> }));
vi.mock('../CheckoutButton', () => ({
  CheckoutButton: () => <div data-testid="checkout-button" />,
}));
vi.mock('../Cart', () => ({ Cart: () => <div data-testid="cart" /> }));
vi.mock('../BuyerInfoForm', () => ({ BuyerInfoForm: () => <div data-testid="buyer-form" /> }));

vi.mock('../../../context/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('TicketTypeList Component', () => {
  const mockAdapter = {
    getTicketTypes: vi.fn(),
  };

  const mockEvent = { id: 'evt_1' };
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      adapter: mockAdapter,
      event: mockEvent,
      ticketTypes: [],
      dispatch: mockDispatch,
      cart: { items: [] },
    } as any);
  });

  it('fetches and renders ticket types', async () => {
    mockAdapter.getTicketTypes.mockResolvedValue([{ id: 't1', name: 'Standard', visible: true }]);

    render(
      <ReactTicketProvider
        event={mockEvent as any}
        adapter={mockAdapter as any}
        onCheckout={vi.fn()}
      >
        <TicketTypeList />
      </ReactTicketProvider>
    );

    await waitFor(() => {
      expect(mockAdapter.getTicketTypes).toHaveBeenCalledWith('evt_1');
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_TICKET_TYPES',
        payload: [{ id: 't1', name: 'Standard', visible: true }],
      });
    });
  });
});
