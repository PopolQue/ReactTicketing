import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../AuthService';
import { StorageAdapter } from 'reactticket-core/types/adapter.types';
import * as cryptoUtils from '../../utils/crypto';

const mockAdapter = {
  getScanAccount: vi.fn(),
  getScanAccountByUsername: vi.fn(),
  incrementScanAccountLoginTimestamp: vi.fn(),
} as unknown as StorageAdapter;

const mockSettings = {
  scanSessionSecret: 'test-secret',
  qrSigningSecret: 'test-qr-secret',
  adminKey: 'pbkdf2-sha256$100$c2FsdA==$ojjAcutwQrIuA8RtzP/TRtIxqt7gCIx/uFU/ooI0DNU=',
  scanSessionTTLHours: 8,
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(mockAdapter, mockSettings as any);
  });

  describe('getters and clearSession', () => {
    it('should return secrets', () => {
      expect(authService.getSecret()).toBe('test-secret');
      expect(authService.getQrSecret()).toBe('test-qr-secret');
    });

    it('should fall back to scanSessionSecret for qr if qrSigningSecret is missing', () => {
      const service2 = new AuthService(mockAdapter, { scanSessionSecret: 'foo' } as any);
      expect(service2.getQrSecret()).toBe('foo');
    });

    it('should resolve clearSession', async () => {
      await expect(authService.clearSession()).resolves.toBeUndefined();
    });
  });

  describe('verifyAdminKey', () => {
    it('should return true for correct passphrase', async () => {
      const isValid = await authService.verifyAdminKey('correct');
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect passphrase', async () => {
      const isValid = await authService.verifyAdminKey('wrong');
      expect(isValid).toBe(false);
    });
  });

  describe('loginScanAccount', () => {
    it('should throw error for unknown user', async () => {
      (mockAdapter.getScanAccountByUsername as any).mockResolvedValue(null);
      await expect(authService.loginScanAccount('event1', 'user', '1234')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should rehash legacy bcrypt passwords to PBKDF2 on first successful login (UT-ACC-03)', async () => {
      const mockAccount = {
        id: 'acc1',
        username: 'legacy',
        pinHash: '$2b$10$abcdefghijklmnopqrstuv',
        pinSalt: 'c2FsdA==',
        active: true,
        credentialVersion: 1,
      };
      (mockAdapter.getScanAccountByUsername as any).mockResolvedValue(mockAccount);
      mockAdapter.updateScanAccount = vi.fn().mockResolvedValue(undefined);

      vi.stubGlobal('crypto', {
        subtle: {
          importKey: vi.fn().mockResolvedValue({}),
          sign: vi.fn().mockResolvedValue(new Uint8Array(32)),
          deriveBits: vi.fn().mockResolvedValue(new Uint8Array(32)),
        },
        getRandomValues: vi.fn().mockReturnValue(new Uint8Array(16)),
      });

      await authService.loginScanAccount('event1', 'legacy', '1234');

      expect(mockAdapter.updateScanAccount).toHaveBeenCalledWith(
        'acc1',
        expect.objectContaining({
          credentialVersion: 2,
          pinHash: expect.any(String),
        })
      );

      vi.unstubAllGlobals();
    });

    it('should throw error for incorrect PIN', async () => {
      const mockAccount = {
        id: 'acc1',
        username: 'user1',
        pinHash: 'wrong-hash',
        pinSalt: 'c2FsdA==',
        active: true,
        credentialVersion: 1,
      };
      (mockAdapter.getScanAccountByUsername as any).mockResolvedValue(mockAccount);

      // Mock hashPin to return something else
      vi.spyOn(authService, 'hashPin').mockResolvedValue('computed-hash');

      await expect(authService.loginScanAccount('event1', 'user1', '1234')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('assertScanSession', () => {
    it('should throw if token signature is invalid', async () => {
      vi.spyOn(cryptoUtils, 'verifyToken').mockResolvedValue(false);
      await expect(authService.assertScanSession('bad.token.signature', 'event1')).rejects.toThrow(
        'Invalid token signature'
      );
    });

    it('should throw if token is expired', async () => {
      const payload = {
        sub: 'acc1',
        usr: 'user1',
        evt: 'event1',
        ver: 1,
        iat: Date.now() - 10000,
        exp: Date.now() - 5000, // Expired
        role: 'scan',
      };
      vi.spyOn(authService as any, 'keyPromise', 'get').mockReturnValue(Promise.resolve({}));

      vi.spyOn(cryptoUtils, 'verifyToken').mockResolvedValue(true);

      const header = { alg: 'HS256', typ: 'JWT' };
      const token = `header.${btoa(JSON.stringify(payload)).replace(/=/g, '')}.signature`;

      await expect(authService.assertScanSession(token, 'event1')).rejects.toThrow('Token expired');
    });

    it('should throw if event mismatch', async () => {
      const payload = {
        sub: 'acc1',
        usr: 'user1',
        evt: 'wrong-event',
        ver: 1,
        iat: Date.now() - 10000,
        exp: Date.now() + 5000,
        role: 'scan',
      };
      vi.spyOn(authService as any, 'keyPromise', 'get').mockReturnValue(Promise.resolve({}));
      vi.spyOn(cryptoUtils, 'verifyToken').mockResolvedValue(true);
      const token = `header.${btoa(JSON.stringify(payload)).replace(/=/g, '')}.signature`;
      await expect(authService.assertScanSession(token, 'event1')).rejects.toThrow(
        'Token event mismatch'
      );
    });

    it('should throw if account is invalid or stale', async () => {
      const payload = {
        sub: 'acc1',
        usr: 'user1',
        evt: 'event1',
        ver: 1,
        iat: Date.now() - 10000,
        exp: Date.now() + 5000,
        role: 'scan',
      };
      vi.spyOn(authService as any, 'keyPromise', 'get').mockReturnValue(Promise.resolve({}));
      vi.spyOn(cryptoUtils, 'verifyToken').mockResolvedValue(true);
      const token = `header.${btoa(JSON.stringify(payload)).replace(/=/g, '')}.signature`;

      (mockAdapter.getScanAccount as any).mockResolvedValue({ active: false });
      await expect(authService.assertScanSession(token, 'event1')).rejects.toThrow(
        'Account invalid or credential stale'
      );

      (mockAdapter.getScanAccount as any).mockResolvedValue({ active: true, credentialVersion: 2 });
      await expect(authService.assertScanSession(token, 'event1')).rejects.toThrow(
        'Account invalid or credential stale'
      );
    });

    it('should return session for valid token', async () => {
      const payload = {
        sub: 'acc1',
        usr: 'user1',
        evt: 'event1',
        ver: 1,
        iat: Date.now() - 10000,
        exp: Date.now() + 5000,
        role: 'scan',
      };
      vi.spyOn(authService as any, 'keyPromise', 'get').mockReturnValue(Promise.resolve({}));
      vi.spyOn(cryptoUtils, 'verifyToken').mockResolvedValue(true);
      const token = `header.${btoa(JSON.stringify(payload)).replace(/=/g, '')}.signature`;

      (mockAdapter.getScanAccount as any).mockResolvedValue({
        active: true,
        credentialVersion: 1,
        assignedLocation: 'door-1',
      });

      const session = await authService.assertScanSession(token, 'event1');
      expect(session.accountId).toBe('acc1');
      expect(session.assignedLocation).toBe('door-1');
    });
  });
});
