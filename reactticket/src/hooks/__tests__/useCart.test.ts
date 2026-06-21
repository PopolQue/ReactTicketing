import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCart } from '../useCart';
import * as useReactTicketModule from '../useReactTicket';

// Mock other hooks
vi.mock('../useCheckout', () => ({
  useCheckout: () => ({ checkout: vi.fn() }),
}));

describe('useCart', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      cart: { items: [] },
      dispatch: mockDispatch,
      ticketTypes: [],
      promoDetails: null,
    } as any);
  });

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem('t1', 1);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_ITEM',
      payload: { ticketTypeId: 't1', quantity: 1 },
    });
  });

  it('removes item from cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.removeItem('t1');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'REMOVE_ITEM',
      payload: { ticketTypeId: 't1' },
    });
  });
});
