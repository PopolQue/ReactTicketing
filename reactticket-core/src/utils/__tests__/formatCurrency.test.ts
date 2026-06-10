import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../formatCurrency';

describe('formatCurrency', () => {
  it('should format EUR in de-DE correctly (UT-FMT-01)', () => {
    const result = formatCurrency(1500, 'EUR', 'de-DE');
    // Using regex or partial match to avoid issues with non-breaking spaces or different char variants
    expect(result).toMatch(/15,00\s*€/);
  });

  it('should format USD in en-US correctly (UT-FMT-02)', () => {
    const result = formatCurrency(4500, 'USD', 'en-US');
    expect(result).toBe('$45.00');
  });

  it('should format zero GBP correctly (UT-FMT-03)', () => {
    const result = formatCurrency(0, 'GBP', 'en-GB');
    expect(result).toBe('£0.00');
  });

  it('should fall back to en-US if no locale provided (UT-FMT-04)', () => {
    const result = formatCurrency(1000, 'USD');
    expect(result).toBe('$10.00');
  });
});
