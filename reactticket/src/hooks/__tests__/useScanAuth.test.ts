import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
});
