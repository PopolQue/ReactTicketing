import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../AuthService';
import { StorageAdapter } from 'reactticket-core/types/adapter.types';

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
        await expect(authService.loginScanAccount('event1', 'user', '1234')).rejects.toThrow('Invalid credentials');
    });

    it('should rehash legacy bcrypt passwords to PBKDF2 on first successful login (UT-ACC-03)', async () => {
        const mockAccount = {
            id: 'acc1',
            username: 'legacy',
            pinHash: '$2b$10$abcdefghijklmnopqrstuv',
            pinSalt: 'c2FsdA==',
            active: true,
            credentialVersion: 1
        };
        (mockAdapter.getScanAccountByUsername as any).mockResolvedValue(mockAccount);
        mockAdapter.updateScanAccount = vi.fn().mockResolvedValue(undefined);

        vi.stubGlobal('crypto', {
            subtle: {
              importKey: vi.fn().mockResolvedValue({}),
              sign: vi.fn().mockResolvedValue(new Uint8Array(32)),
              deriveBits: vi.fn().mockResolvedValue(new Uint8Array(32)),
            },
            getRandomValues: vi.fn().mockReturnValue(new Uint8Array(16))
        });

        await authService.loginScanAccount('event1', 'legacy', '1234');
        
        expect(mockAdapter.updateScanAccount).toHaveBeenCalledWith('acc1', expect.objectContaining({
            credentialVersion: 2,
            pinHash: expect.any(String)
        }));
        
        vi.unstubAllGlobals();
    });
  });
});
