import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVoucher } from '../useVoucher';
import * as useReactTicketModule from '../useReactTicket';

describe('useVoucher', () => {
  const mockAdapter = {
    getPromoCode: vi.fn(),
  };
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      adapter: mockAdapter,
      dispatch: mockDispatch,
      cart: { promoCode: undefined },
      promoDetails: null,
    } as any);
  });

  it('applies a valid promo code', async () => {
    const mockPromo = { code: 'SAVE20', active: true };
    mockAdapter.getPromoCode.mockResolvedValue(mockPromo);

    const { result } = renderHook(() => useVoucher());

    let success = false;
    await act(async () => {
      success = await result.current.applyVoucher('SAVE20');
    });

    expect(success).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_PROMO_CODE', payload: 'SAVE20' });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_PROMO_DETAILS', payload: mockPromo });
  });

  it('fails to apply invalid promo code', async () => {
    mockAdapter.getPromoCode.mockResolvedValue(null);

    const { result } = renderHook(() => useVoucher());

    let success = true;
    await act(async () => {
      success = await result.current.applyVoucher('INVALID');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Promo code invalid or expired');
  });

  it('removes the voucher', () => {
    const { result } = renderHook(() => useVoucher());

    act(() => {
      result.current.removeVoucher();
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_PROMO' });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_PROMO_DETAILS', payload: null });
  });
});
