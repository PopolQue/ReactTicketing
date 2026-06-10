import { describe, it, expect } from 'vitest';
import { validateAdapterSettings, isValidEmail, isValidUsername, isValidPin } from '../validation';

describe('validation utils', () => {
  describe('isValidEmail', () => {
    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
    });
  });

  describe('validateAdapterSettings (UT-GUARD-*)', () => {
    it('should error for LocalStorage in production scanner mode (UT-GUARD-01)', () => {
      const result = validateAdapterSettings('LocalStorageAdapter', 'scanner', 'production');
      expect(result?.type).toBe('error');
    });

    it('should error for LocalStorage in production admin mode (UT-GUARD-02)', () => {
      const result = validateAdapterSettings('LocalStorageAdapter', 'admin', 'production');
      expect(result?.type).toBe('error');
    });

    it('should not error for LocalStorage in production storefront mode (UT-GUARD-03)', () => {
      const result = validateAdapterSettings('LocalStorageAdapter', 'storefront', 'production');
      expect(result).toBeNull();
    });

    it('should warn for LocalStorage in development scanner mode (UT-GUARD-04)', () => {
      const result = validateAdapterSettings('LocalStorageAdapter', 'scanner', 'development');
      expect(result?.type).toBe('warn');
    });

    it('should not error for RestAdapter in production scanner mode (UT-GUARD-05)', () => {
      const result = validateAdapterSettings('RestAdapter', 'scanner', 'production');
      expect(result).toBeNull();
    });
  });
});
