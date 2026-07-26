import { describe, it, expect } from 'vitest';
import { KuhFestivalConfig, FestivalTicketTier } from '../types';

describe('KuhTicketing Module Types & Logic', () => {
  it('validates default festival configuration', () => {
    const config: KuhFestivalConfig = {
      festivalName: 'Klein und Haarig Festival',
      tagline: 'Indie & Electronic Experience',
      startDate: '14. - 16. August 2026',
      endDate: '16. August 2026',
      location: 'Wiesenland Open Air',
    };

    expect(config.festivalName).toBe('Klein und Haarig Festival');
    expect(config.startDate).toContain('August 2026');
  });

  it('correctly calculates ticket tier subtotals', () => {
    const tier: FestivalTicketTier = {
      id: 'tier_1',
      name: 'Early Haarig Weekend Pass',
      pricing: { kind: 'paid', priceInCents: 8900, currency: 'EUR' },
      transferable: true,
      visible: true,
    };

    const quantity = 3;
    const priceCents = tier.pricing.kind === 'paid' ? tier.pricing.priceInCents : 0;
    const subtotal = priceCents * quantity;

    expect(subtotal).toBe(26700);
  });
});
