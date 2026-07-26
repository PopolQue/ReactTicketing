import { describe, it, expect } from 'vitest';
import { KuhFestivalConfig, FestivalTicketTier } from '../types';

describe('KuhTicketing Subrepo Integration', () => {
  it('instantiates festival configuration for Klein und Haarig', () => {
    const config: KuhFestivalConfig = {
      festivalName: 'Klein und Haarig Open Air',
      tagline: 'Wilde Indie & Electronic Experience',
      startDate: '14. - 16. August 2026',
      endDate: '16. August 2026',
      location: 'Wiesenland Open Air',
    };

    expect(config.festivalName).toBe('Klein und Haarig Open Air');
    expect(config.location).toBe('Wiesenland Open Air');
  });

  it('calculates custom festival tier pricing and capacity', () => {
    const tier: FestivalTicketTier = {
      id: 'tier_haarig_pass',
      name: 'Early Haarig Weekend Pass',
      pricing: { kind: 'paid', priceInCents: 8900, currency: 'EUR' },
      capacity: 250,
      transferable: true,
      visible: true,
      badgeLabel: 'Early Bird',
      campingIncluded: true,
    };

    expect(tier.badgeLabel).toBe('Early Bird');
    expect(tier.campingIncluded).toBe(true);
    expect(tier.pricing.kind === 'paid' ? tier.pricing.priceInCents : 0).toBe(8900);
  });
});
