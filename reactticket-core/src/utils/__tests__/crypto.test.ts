import { describe, it, expect, vi, beforeAll } from 'vitest';
import { generateHMAC, signToken, verifyToken } from '../crypto';

describe('crypto utils', () => {
  let mockKey: CryptoKey;

  beforeAll(async () => {
    mockKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('test-secret'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  });

  describe('generateHMAC', () => {
    it('should generate HMAC', async () => {
      const hmac = await generateHMAC(mockKey, 'test-data');
      expect(hmac).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('signToken and verifyToken', () => {
    it('should sign and verify token correctly', async () => {
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = { sub: '123' };
      
      const token = await signToken(header, payload, mockKey);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const isValid = await verifyToken(token, mockKey);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid token', async () => {
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = { sub: '123' };
      
      const token = await signToken(header, payload, mockKey);
      const parts = token.split('.');
      const invalidToken = `${parts[0]}.${parts[1]}.invalid`;

      const isValid = await verifyToken(invalidToken, mockKey);
      expect(isValid).toBe(false);
    });
  });
});
