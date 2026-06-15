import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCheckout } from '../useCheckout';
import * as useReactTicketModule from '../useReactTicket';
import { AuthService } from 'reactticket-core/services/AuthService';
import { TicketService } from 'reactticket-core/services/TicketService';
import { PDFRenderer } from 'reactticket-core/services/PDFRenderer';

vi.mock('reactticket-core/services/AuthService', () => ({
  AuthService: class { }
}));

vi.mock('reactticket-core/services/TicketService', () => ({
  TicketService: class {
    prepareTickets = vi.fn().mockResolvedValue([{ id: 't1', buyerEmail: 'test@example.com' }]);
  }
}));

vi.mock('reactticket-core/services/PDFRenderer', () => ({
  PDFRenderer: {
    render: vi.fn().mockResolvedValue(new Blob())
  }
}));

describe('useCheckout', () => {
  const mockAdapter = {
    countIssuedTickets: vi.fn(),
    createCheckoutTransaction: vi.fn(),
    incrementPromoUsage: vi.fn(),
  };

  const mockEvent = { id: 'evt_1', name: 'Event', settings: {} };
  const mockDispatch = vi.fn();
  const mockOnCheckout = vi.fn().mockResolvedValue('confirmed');
  const mockOnTicketIssued = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window alert
    vi.stubGlobal('alert', vi.fn());

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      cart: { 
        items: [{ ticketTypeId: 't1', quantity: 1 }], 
        personalizations: { 't1': [{ email: 'test@example.com' }] },
        promoCode: 'SAVE'
      },
      dispatch: mockDispatch,
      ticketTypes: [{ id: 't1', name: 'Standard', pricing: { kind: 'paid', priceInCents: 1000 } }],
      adapter: mockAdapter,
      event: mockEvent,
      onCheckout: mockOnCheckout,
      onTicketIssued: mockOnTicketIssued
    } as any);
  });

  it('executes checkout successfully', async () => {
    mockAdapter.countIssuedTickets.mockResolvedValue(0);
    const { result } = renderHook(() => useCheckout({ subtotalCents: 1000, discountCents: 0, totalCents: 1000 }));
    
    await act(async () => {
      await result.current.checkout();
    });

    expect(mockOnCheckout).toHaveBeenCalled();
    expect(mockAdapter.createCheckoutTransaction).toHaveBeenCalled();
    expect(mockOnTicketIssued).toHaveBeenCalled();
    expect(mockAdapter.incrementPromoUsage).toHaveBeenCalledWith('SAVE');
  });
});
