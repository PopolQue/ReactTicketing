import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCartTotals } from '../useCartTotals';

describe('useCartTotals', () => {
  const ticketTypes = [
    { id: 't1', pricing: { kind: 'paid', priceInCents: 1000 } }
  ] as any;

  it('calculates totals without promo', () => {
    const cartItems = [{ ticketTypeId: 't1', quantity: 2 }];
    const { result } = renderHook(() => useCartTotals(cartItems, ticketTypes, null));
    
    expect(result.current).toEqual({
      subtotalCents: 2000,
      discountCents: 0,
      totalCents: 2000
    });
  });

  it('calculates totals with percent discount', () => {
    const cartItems = [{ ticketTypeId: 't1', quantity: 2 }];
    const promo = { 
        active: true, 
        discount: { kind: 'percent_off', percent: 20 } 
    } as any;
    
    const { result } = renderHook(() => useCartTotals(cartItems, ticketTypes, promo));
    
    expect(result.current).toEqual({
      subtotalCents: 2000,
      discountCents: 400, // 20% of 2000
      totalCents: 1600
    });
  });

  it('calculates totals with amount discount', () => {
    const cartItems = [{ ticketTypeId: 't1', quantity: 2 }];
    const promo = { 
        active: true, 
        discount: { kind: 'amount_off', amountCents: 500 } 
    } as any;
    
    const { result } = renderHook(() => useCartTotals(cartItems, ticketTypes, promo));
    
    expect(result.current).toEqual({
      subtotalCents: 2000,
      discountCents: 500,
      totalCents: 1500
    });
  });
});
