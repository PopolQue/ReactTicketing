import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScanAccounts } from '../useScanAccounts';
import * as useReactTicketModule from '../useReactTicket';
import { ScanAccountService } from 'reactticket-core/services/ScanAccountService';

const mockCreateAccount = vi.fn();
const mockListAccounts = vi.fn();
const mockDeactivate = vi.fn();

vi.mock('reactticket-core/services/ScanAccountService', () => {
  class MockScanAccountService {
    createAccount = mockCreateAccount;
    list = mockListAccounts;
    deactivate = mockDeactivate;
  }
  return { ScanAccountService: MockScanAccountService };
});

describe('useScanAccounts', () => {
  const mockEvent = { id: 'evt_1' };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      event: mockEvent,
      adapter: {} as any,
    } as any);
  });

  it('initializes and lists accounts', async () => {
    mockListAccounts.mockResolvedValue([{ id: 'acc1', username: 'crew1' }]);

    const { result } = renderHook(() => useScanAccounts('evt_1'));

    // Check initial state
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accounts).toEqual([{ id: 'acc1', username: 'crew1' }]);
    expect(mockListAccounts).toHaveBeenCalledWith('evt_1');
  });

  it('creates a new account', async () => {
    mockListAccounts.mockResolvedValue([]);

    const { result } = renderHook(() => useScanAccounts('evt_1'));

    await act(async () => {
      await result.current.create({ username: 'crew2', pin: '1234' });
    });

    expect(mockCreateAccount).toHaveBeenCalledWith('evt_1', 'crew2', '1234', undefined);
    // Depending on the implementation of useScanAccounts, it might call listAccounts again
    // In this hook, `create` calls `fetchAccounts` which calls `list`
    expect(mockListAccounts).toHaveBeenCalledTimes(2);
  });
});
