import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanService } from '../services/ScanService';
import { StorageAdapter } from '../types/adapter.types';

describe('ScanService', () => {
  const mockAdapter = {
    getTicket: vi.fn(),
    updateTicketStatus: vi.fn(),
    getScanAccount: vi.fn(),
    saveScanEvent: vi.fn(),
  } as unknown as StorageAdapter;

  const scanService = new ScanService(mockAdapter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should admit a valid ticket and update status', async () => {
    mockAdapter.getTicket = vi.fn().mockResolvedValue({
      id: 't1',
      status: 'valid'
    });
    mockAdapter.getScanAccount = vi.fn().mockResolvedValue({ username: 'crew1' });

    const result = await scanService.validateTicket('t1', 'acc1');
    
    expect(result).toBe('admitted');
    expect(mockAdapter.updateTicketStatus).toHaveBeenCalledWith('t1', 'used');
    expect(mockAdapter.saveScanEvent).toHaveBeenCalled();
  });

  it('should return already_used for a used ticket', async () => {
    mockAdapter.getTicket = vi.fn().mockResolvedValue({
      id: 't2',
      status: 'used'
    });

    const result = await scanService.validateTicket('t2', 'acc1');
    
    expect(result).toBe('already_used');
    expect(mockAdapter.updateTicketStatus).not.toHaveBeenCalled();
  });
});
