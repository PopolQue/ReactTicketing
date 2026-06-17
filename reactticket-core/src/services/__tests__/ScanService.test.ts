import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanService } from '../ScanService';
import { StorageAdapter } from 'reactticket-core/types/adapter.types';
import { AuthService } from '../AuthService';

const mockAdapter = {
  getTicket: vi.fn(),
  updateTicketStatus: vi.fn(),
  saveScanEvent: vi.fn(),
  getIssuedTickets: vi.fn(),
  getScanEvents: vi.fn(),
} as unknown as StorageAdapter;

const mockAuthService = {
  assertScanSession: vi.fn(),
  getSecret: vi.fn().mockReturnValue('test-secret'),
} as unknown as AuthService;

const mockSession = {
  token: 'valid-token',
  accountId: 'acc1',
  accountUsername: 'staff',
  eventId: 'event1',
} as any;

describe('ScanService', () => {
  let service: ScanService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ScanService(mockAdapter, mockAuthService);
    
    (mockAuthService.assertScanSession as any).mockResolvedValue(undefined);
    
    // Mock crypto.subtle for HMAC verification
    vi.stubGlobal('crypto', {
      subtle: {
        importKey: vi.fn().mockResolvedValue({}),
        verify: vi.fn().mockResolvedValue(true),
      }
    });
  });

  describe('validateTicket', () => {
    it('should throw if session is invalid (UT-SCAN-01)', async () => {
      (mockAuthService.assertScanSession as any).mockRejectedValue(new Error('Invalid session'));
      await expect(service.validateTicket('payload', mockSession, 'event1')).rejects.toThrow('Invalid session');
    });

    it('should admit a valid ticket (UT-SCAN-02)', async () => {
      const now = Date.now();
      const payload = `TF1.event1.ticket1|${now}.SGFzaA==`;
      const ticket = { id: 'ticket1', status: 'issued' };
      (mockAdapter.getTicket as any).mockResolvedValue(ticket);

      const result = await service.validateTicket(payload, mockSession, 'event1');
      
      expect(result.result).toBe('admitted');
      expect(mockAdapter.updateTicketStatus).toHaveBeenCalledWith('ticket1', 'used');
      expect(mockAdapter.saveScanEvent).toHaveBeenCalled();
    });

    it('should return already_used for used tickets (UT-SCAN-03)', async () => {
      const now = Date.now();
      const payload = `TF1.event1.ticket1|${now}.SGFzaA==`;
      const ticket = { id: 'ticket1', status: 'used' };
      (mockAdapter.getTicket as any).mockResolvedValue(ticket);

      const result = await service.validateTicket(payload, mockSession, 'event1');
      
      expect(result.result).toBe('already_used');
      expect(mockAdapter.updateTicketStatus).not.toHaveBeenCalled();
    });

    it('should return invalid for bad HMAC (UT-SCAN-04)', async () => {
      (crypto.subtle.verify as any).mockResolvedValue(false);
      const payload = 'TF1.event1.ticket1.SGFzaA==';
      (mockAdapter.getTicket as any).mockResolvedValue({ id: 'ticket1' });

      const result = await service.validateTicket(payload, mockSession, 'event1');
      expect(result.result).toBe('invalid');
    });
  });

  describe('getAnalytics', () => {
      it('should aggregate data correctly', async () => {
          (mockAdapter.getIssuedTickets as any).mockResolvedValue([
              { id: 't1', ticketTypeId: 'vip', status: 'used' },
              { id: 't2', ticketTypeId: 'gen', status: 'issued' }
          ]);
          (mockAdapter.getScanEvents as any).mockResolvedValue([
              { result: 'admitted', scannedAt: new Date() },
              { result: 'already_used', scannedAt: new Date() }
          ]);

          const data = await service.getAnalytics('event1');
          expect(data.totalAdmitted).toBe(1);
          expect(data.totalIssued).toBe(2);
          expect(data.duplicateScanCount).toBe(1);
      });
  });
});
