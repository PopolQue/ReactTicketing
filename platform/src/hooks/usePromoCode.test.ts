import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePromoCode } from './usePromoCode';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

const mockSingle = vi.fn();
const mockEq3 = vi.fn().mockReturnValue({ single: mockSingle });
const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

describe('usePromoCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => usePromoCode('event-123'));

    expect(result.current.promoCode).toBe('');
    expect(result.current.appliedPromo).toBeNull();
    expect(result.current.promoError).toBe('');
  });

  it('fails to apply invalid promo code', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Not found') });

    const { result } = renderHook(() => usePromoCode('event-123'));

    act(() => {
      result.current.setPromoCode('INVALID');
    });

    await act(async () => {
      await result.current.applyPromo();
    });

    expect(result.current.promoError).toBe('Invalid or expired promo code');
    expect(result.current.appliedPromo).toBeNull();
  });

  it('applies valid amount_off promo code and calculates discount', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { code: 'SAVE10', discount_kind: 'amount_off', discount_value: 1000 },
      error: null,
    });

    const { result } = renderHook(() => usePromoCode('event-123'));

    act(() => {
      result.current.setPromoCode('SAVE10');
    });

    await act(async () => {
      await result.current.applyPromo();
    });

    expect(result.current.promoError).toBe('');
    expect(result.current.appliedPromo).toBeTruthy();

    // Subtotal 5000 cents (50 EUR) -> 1000 cents off = 4000 cents
    expect(result.current.getDiscountedAmount(5000)).toBe(4000);

    // Prevent negative subtotal
    expect(result.current.getDiscountedAmount(500)).toBe(0);
  });

  it('calculates percent_off discount correctly', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { code: 'HALF', discount_kind: 'percent_off', discount_value: 50 },
      error: null,
    });

    const { result } = renderHook(() => usePromoCode('event-123'));

    act(() => {
      result.current.setPromoCode('HALF');
    });

    await act(async () => {
      await result.current.applyPromo();
    });

    // 50% off 5000 cents = 2500 cents
    expect(result.current.getDiscountedAmount(5000)).toBe(2500);
  });

  it('calculates free discount correctly', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { code: 'FREEBIE', discount_kind: 'free', discount_value: 0 },
      error: null,
    });

    const { result } = renderHook(() => usePromoCode('event-123'));

    act(() => {
      result.current.setPromoCode('FREEBIE');
    });

    await act(async () => {
      await result.current.applyPromo();
    });

    expect(result.current.getDiscountedAmount(5000)).toBe(0);
  });

  it('removes applied promo code', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { code: 'FREEBIE', discount_kind: 'free', discount_value: 0 },
      error: null,
    });

    const { result } = renderHook(() => usePromoCode('event-123'));

    act(() => {
      result.current.setPromoCode('FREEBIE');
    });

    await act(async () => {
      await result.current.applyPromo();
    });

    expect(result.current.appliedPromo).not.toBeNull();

    act(() => {
      result.current.removePromo();
    });

    expect(result.current.appliedPromo).toBeNull();
    expect(result.current.promoCode).toBe('');
  });

  it('handles unknown discount_kind', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { code: 'UNKNOWN', discount_kind: 'invalid_kind', discount_value: 0 },
      error: null,
    });

    const { result } = renderHook(() => usePromoCode('event-123'));

    act(() => {
      result.current.setPromoCode('UNKNOWN');
    });

    await act(async () => {
      await result.current.applyPromo();
    });

    expect(result.current.getDiscountedAmount(5000)).toBe(5000);
  });
});
