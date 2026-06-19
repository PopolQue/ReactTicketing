import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useScanAuth } from '../useScanAuth';
import * as useReactTicketModule from '../useReactTicket';
import { AuthService } from 'reactticket-core/services/AuthService';

const mockLoginScanAccount = vi.fn();

// Use a class for the mock implementation so it can be used as a constructor
vi.mock('reactticket-core/services/AuthService', () => {
  class MockAuthService {
    loginScanAccount = mockLoginScanAccount;
  }
  return { AuthService: MockAuthService };
});

describe('useScanAuth', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock session storage
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      event: { id: 'evt_1', settings: {} },
      adapter: {},
      dispatch: mockDispatch,
      authSession: null
    } as any);
  });

  afterEach(() => {
      vi.useRealTimers();
  });

  it('performs login successfully', async () => {
    const mockSession = { token: 'valid-token', role: 'scan' };
    mockLoginScanAccount.mockResolvedValue(mockSession);
    
    const { result } = renderHook(() => useScanAuth('evt_1'));
    
    await act(async () => {
      await result.current.login('user1', '1234');
    });

    expect(mockLoginScanAccount).toHaveBeenCalledWith('evt_1', 'user1', '1234');
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_AUTH_SESSION', payload: mockSession });
  });

  it('handles login failure and increments failure count', async () => {
    mockLoginScanAccount.mockRejectedValue(new Error('Invalid PIN'));
    
    const { result } = renderHook(() => useScanAuth('evt_1'));
    
    await act(async () => {
      try {
        await result.current.login('user1', 'wrong');
      } catch (e) {
        // ignore
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Invalid PIN');
    });
  });

  it('locks out after max failures and handles unlock', async () => {
    vi.useFakeTimers();
    mockLoginScanAccount.mockRejectedValue(new Error('Invalid PIN'));
    
    const { result } = renderHook(() => useScanAuth('evt_1'));
    
    // Fail 5 times
    for (let i = 0; i < 5; i++) {
        await act(async () => {
            try {
                await result.current.login('user1', 'wrong');
            } catch (e) {}
        });
    }

    expect(result.current.isLocked).toBe(true);
    expect(result.current.lockRemainingSeconds).toBeGreaterThan(0);
    expect(sessionStorage.setItem).toHaveBeenCalledWith('tf_lockout_evt_1', expect.any(String));

    // Trying to login while locked throws
    await act(async () => {
        try {
            await result.current.login('user1', '1234');
        } catch (e: any) {
            expect(e.message).toMatch(/Locked for/);
        }
    });

    // Fast forward time to unlock
    act(() => {
        vi.advanceTimersByTime(35000); // More than 30s
    });

    expect(result.current.isLocked).toBe(false);
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('tf_lockout_evt_1');
  });

  it('handles storage errors safely', async () => {
    mockLoginScanAccount.mockRejectedValue(new Error('Invalid PIN'));
    
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(() => { throw new Error('Quota exceeded'); }),
      removeItem: vi.fn(),
    });

    const { result } = renderHook(() => useScanAuth('evt_1'));
    
    // Fail 5 times
    for (let i = 0; i < 5; i++) {
        await act(async () => {
            try {
                await result.current.login('user1', 'wrong');
            } catch (e) {}
        });
    }

    expect(result.current.error).toBe('Storage access blocked');
  });

  it('handles initial locked state from storage', () => {
    const futureTime = Date.now() + 10000;
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn().mockReturnValue(futureTime.toString()),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    const { result } = renderHook(() => useScanAuth('evt_1'));
    
    expect(result.current.isLocked).toBe(true);
  });

  it('performs logout successfully', () => {
    const { result } = renderHook(() => useScanAuth('evt_1'));
    
    act(() => {
      result.current.logout();
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_AUTH_SESSION', payload: null });
  });
});
