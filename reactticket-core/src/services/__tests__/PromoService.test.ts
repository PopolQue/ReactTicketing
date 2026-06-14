import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromoService } from '../PromoService';
import { StorageAdapter } from '../../types/adapter.types';
import { Order } from '../../types/ticket.types';
import { PromoCode } from '../../types/promo.types';

describe('PromoService', () => {
  let promoService: PromoService;
  let mockAdapter: Partial<StorageAdapter>;

  beforeEach(() => {
    mockAdapter = {
      getPromoCode: vi.fn(),
    };
    promoService = new PromoService(mockAdapter as StorageAdapter);
  });

  const createOrder = (ticketTypeIds: string[]): Order => ({
    id: 'order_1',
    eventId: 'evt_1',
    items: ticketTypeIds.map(id => ({
      ticketTypeId: id,
      quantity: 1,
      unitPriceBeforeDiscountCents: 1000,
      unitPriceCents: 1000,
      personalizations: []
    })),
    buyerEmail: 'test@example.com',
    subtotalCents: 1000,
    discountCents: 0,
    totalCents: 1000,
    status: 'pending',
    createdAt: new Date(),
  });

  const createPromo = (overrides: Partial<PromoCode> = {}): PromoCode => ({
    code: 'SAVE10',
    discount: { kind: 'amount_off', amountCents: 1000 },
    usedCount: 0,
    createdAt: new Date(),
    active: true,
    ...overrides
  });

  it('should return false if promo code does not exist', async () => {
    (mockAdapter.getPromoCode as any).mockResolvedValue(null);
    const result = await promoService.validate('INVALID', createOrder(['tkt_1']));
    expect(result).toBe(false);
  });

  it('should return false if promo code is inactive', async () => {
    (mockAdapter.getPromoCode as any).mockResolvedValue(createPromo({ active: false }));
    const result = await promoService.validate('SAVE10', createOrder(['tkt_1']));
    expect(result).toBe(false);
  });

  it('should return false if promo code is expired', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    (mockAdapter.getPromoCode as any).mockResolvedValue(createPromo({ expiresAt: pastDate }));
    const result = await promoService.validate('SAVE10', createOrder(['tkt_1']));
    expect(result).toBe(false);
  });

  it('should return false if promo code has reached max uses', async () => {
    (mockAdapter.getPromoCode as any).mockResolvedValue(createPromo({ maxUses: 5, usedCount: 5 }));
    const result = await promoService.validate('SAVE10', createOrder(['tkt_1']));
    expect(result).toBe(false);
  });

  it('should return false if promo code does not apply to any item in order', async () => {
    (mockAdapter.getPromoCode as any).mockResolvedValue(createPromo({ appliesTo: ['tkt_2'] }));
    const result = await promoService.validate('SAVE10', createOrder(['tkt_1']));
    expect(result).toBe(false);
  });

  it('should return true if promo code applies to at least one item in order', async () => {
    (mockAdapter.getPromoCode as any).mockResolvedValue(createPromo({ appliesTo: ['tkt_2', 'tkt_3'] }));
    const result = await promoService.validate('SAVE10', createOrder(['tkt_1', 'tkt_2']));
    expect(result).toBe(true);
  });

  it('should return true for a valid promo code with no restrictions', async () => {
    (mockAdapter.getPromoCode as any).mockResolvedValue(createPromo());
    const result = await promoService.validate('SAVE10', createOrder(['tkt_1']));
    expect(result).toBe(true);
  });
});
