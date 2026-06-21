import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanAccountService } from '../ScanAccountService';
import { StorageAdapter } from 'reactticket-core/types/adapter.types';

const mockAdapter = {
  getScanAccount: vi.fn(),
  listScanAccounts: vi.fn(),
  saveScanAccount: vi.fn(),
  updateScanAccount: vi.fn(),
  deleteScanAccount: vi.fn(),
  getScanAccountByUsername: vi.fn(),
} as unknown as StorageAdapter;

describe('ScanAccountService', () => {
  let service: ScanAccountService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ScanAccountService(mockAdapter);
  });

  describe('createAccount', () => {
    it('should create an account with a hashed PIN (UT-ACC-01)', async () => {
      const account = await service.createAccount('event1', 'staff', '1234');
      expect(account.username).toBe('staff');
      expect(account.pinHash).toBeDefined();
      expect(account.pinSalt).toBeDefined();
      expect(account.credentialVersion).toBe(1);
      expect(mockAdapter.saveScanAccount).toHaveBeenCalled();
    });
  });

  describe('resetPin', () => {
    it('should increment credentialVersion (UT-ACC-03)', async () => {
      const oldAccount = { id: 'acc1', credentialVersion: 1 };
      (mockAdapter.getScanAccount as any).mockResolvedValue(oldAccount);

      await service.resetPin('acc1', '5678');
      expect(mockAdapter.updateScanAccount).toHaveBeenCalledWith(
        'acc1',
        expect.objectContaining({
          credentialVersion: 2,
        })
      );
    });
  });

  describe('deactivate/reactivate', () => {
    it('should update active flag (UT-ACC-05, UT-ACC-06)', async () => {
      await service.deactivate('acc1');
      expect(mockAdapter.updateScanAccount).toHaveBeenCalledWith('acc1', { active: false });

      await service.reactivate('acc1');
      expect(mockAdapter.updateScanAccount).toHaveBeenCalledWith('acc1', { active: true });
    });
  });

  describe('list', () => {
    it('should not return pinHash or pinSalt in output (UT-ACC-08)', async () => {
      (mockAdapter.listScanAccounts as any).mockResolvedValue([
        { id: 'acc1', username: 'user1', pinHash: 'secret', pinSalt: 'salt' },
      ]);

      const result = await service.list('event1');
      expect(result[0]).not.toHaveProperty('pinHash');
      expect(result[0]).not.toHaveProperty('pinSalt');
      expect(result[0].username).toBe('user1');
    });
  });

  describe('loginLegacyAccount', () => {
    it('should return false if account is not found or inactive', async () => {
      (mockAdapter.getScanAccountByUsername as any).mockResolvedValue(null);
      const res1 = await service.loginLegacyAccount('event1', 'user', '1234');
      expect(res1).toBe(false);

      (mockAdapter.getScanAccountByUsername as any).mockResolvedValue({ active: false });
      const res2 = await service.loginLegacyAccount('event1', 'user', '1234');
      expect(res2).toBe(false);
    });

    it('should return false if hash does not start with $2b$', async () => {
      (mockAdapter.getScanAccountByUsername as any).mockResolvedValue({
        id: 'acc1',
        active: true,
        pinHash: 'not-bcrypt',
      });
      const res = await service.loginLegacyAccount('event1', 'user', '1234');
      expect(res).toBe(false);
    });

    it('should return true and reset pin if hash starts with $2b$', async () => {
      (mockAdapter.getScanAccountByUsername as any).mockResolvedValue({
        id: 'acc1',
        active: true,
        pinHash: '$2b$something',
      });
      (mockAdapter.getScanAccount as any).mockResolvedValue({ id: 'acc1', credentialVersion: 1 });

      const res = await service.loginLegacyAccount('event1', 'user', '1234');
      expect(res).toBe(true);
      expect(mockAdapter.updateScanAccount).toHaveBeenCalledWith(
        'acc1',
        expect.objectContaining({
          credentialVersion: 2,
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete account', async () => {
      await service.delete('acc1');
      expect(mockAdapter.deleteScanAccount).toHaveBeenCalledWith('acc1');
    });
  });
});
