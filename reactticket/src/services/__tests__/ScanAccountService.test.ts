import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanAccountService } from '../ScanAccountService';
import { StorageAdapter } from '../../../../reactticket-core/src/types/adapter.types';

const mockAdapter = {
  getScanAccount: vi.fn(),
  listScanAccounts: vi.fn(),
  saveScanAccount: vi.fn(),
  updateScanAccount: vi.fn(),
  deleteScanAccount: vi.fn(),
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
      expect(mockAdapter.updateScanAccount).toHaveBeenCalledWith('acc1', expect.objectContaining({
        credentialVersion: 2
      }));
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
        { id: 'acc1', username: 'user1', pinHash: 'secret', pinSalt: 'salt' }
      ]);

      const result = await service.list('event1');
      expect(result[0]).not.toHaveProperty('pinHash');
      expect(result[0]).not.toHaveProperty('pinSalt');
      expect(result[0].username).toBe('user1');
    });
  });
});
