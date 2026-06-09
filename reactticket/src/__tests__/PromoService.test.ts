import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromoService } from '../services/PromoService';
import { StorageAdapter } from '../types/adapter.types';
import { Order } from '../types/ticket.types';

describe('PromoService', () => {
  const mockAdapter = {
    getPromoCode: vi.fn(),
  } as unknown as StorageAdapter;

  const promoService = new PromoService(mockAdapter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate a correct promo code', async () => {
    mockAdapter.getPromoCode = vi.fn().mockResolvedValue({
      code: 'SUMMER20',
      active: true,
      usedCount: 0,
      maxUses: 10
    });

    const order = { items: [{ ticketTypeId: 't1' }] } as Order;
    const isValid = await promoService.validate('SUMMER20', order);
    
    expect(isValid).toBe(true);
  });

  it('should invalidate an expired promo code', async () => {
    mockAdapter.getPromoCode = vi.fn().mockResolvedValue({
      code: 'EXPIRED',
      active: true,
      expiresAt: new Date(Date.now() - 1000)
    });

    const order = { items: [{ ticketTypeId: 't1' }] } as Order;
    const isValid = await promoService.validate('EXPIRED', order);
    
    expect(isValid).toBe(false);
  });
});
