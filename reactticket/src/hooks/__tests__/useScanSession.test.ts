import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScanSession } from '../useScanSession';
import * as useReactTicketModule from '../useReactTicket';

vi.mock('reactticket-core/services/ScanService', () => ({ 
    ScanService: class {
        validateTicket = vi.fn().mockResolvedValue({ result: 'admitted' });
    } 
}));
vi.mock('reactticket-core/services/AuthService', () => ({ AuthService: vi.fn() }));
vi.mock('reactticket-core/utils/jsQR', () => ({ default: vi.fn() }));

describe('useScanSession', () => {
  const mockVideoRef = { current: { 
      readyState: 4, 
      videoWidth: 100, 
      videoHeight: 100, 
      srcObject: { getTracks: () => [{ stop: vi.fn() }] },
      play: vi.fn().mockResolvedValue(undefined),
      setAttribute: vi.fn()
  } };

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.stubGlobal('navigator', {
        mediaDevices: {
            getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] })
        }
    });

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      event: { id: 'evt_1', settings: {} },
      authSession: { role: 'scan', token: 'token' },
      adapter: {}
    } as any);
  });

  it('scans manually', async () => {
    const { result } = renderHook(() => useScanSession('evt_1', mockVideoRef as any));
    
    await act(async () => {
      await result.current.scanManual('qr1');
    });
    
    expect(result.current.lastResult).toEqual({ result: 'admitted' });
  });

  it('sets last result', async () => {
    const { result } = renderHook(() => useScanSession('evt_1', mockVideoRef as any));
    
    act(() => {
        result.current.setLastResult({ result: 'denied' } as any);
    });
    
    expect(result.current.lastResult).toEqual({ result: 'denied' });
  });

  it('handles camera access error', async () => {
    vi.stubGlobal('navigator', {
        mediaDevices: {
            getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied'))
        }
    });
    const { result } = renderHook(() => useScanSession('evt_1', mockVideoRef as any));
    
    await act(async () => {
        try {
            await result.current.startCamera();
        } catch (e) {
            // error expected
        }
    });
    
    expect(result.current.isScanning).toBe(false);
  });
});
