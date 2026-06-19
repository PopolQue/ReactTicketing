import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
      HAVE_ENOUGH_DATA: 4,
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
        },
        onLine: true
    });

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      event: { id: 'evt_1', settings: {} },
      authSession: { role: 'scan', token: 'token', expiresAt: Date.now() + 10000 },
      adapter: {
          getQueuedScanEvents: vi.fn().mockResolvedValue([]),
          saveScanEvent: vi.fn().mockResolvedValue(undefined),
          clearQueuedScanEvents: vi.fn().mockResolvedValue(undefined),
          queueScanEvent: vi.fn().mockResolvedValue(undefined)
      }
    } as any);

    // Mock document.createElement for canvas
    const mockContext = {
        drawImage: vi.fn(),
        getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(), width: 100, height: 100 })
    };
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
            return {
                getContext: vi.fn().mockReturnValue(mockContext),
                width: 100,
                height: 100
            } as any;
        }
        return originalCreateElement(tagName);
    });
  });

  afterEach(() => {
      vi.restoreAllMocks();
  });

  it('scans manually', async () => {
    const { result } = renderHook(() => useScanSession('evt_1', mockVideoRef as any));
    
    await act(async () => {
      await result.current.scanManual('qr1');
    });
    
    expect(result.current.lastResult).toEqual({ result: 'admitted' });
  });

  it('scanManual throws if not authenticated', async () => {
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
        event: { id: 'evt_1', settings: {} },
        authSession: null,
        adapter: {}
    } as any);
    const { result } = renderHook(() => useScanSession('evt_1', mockVideoRef as any));
    
    await expect(result.current.scanManual('qr1')).rejects.toThrow('Not authenticated');
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
        },
        onLine: true
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

  it('starts and stops camera', async () => {
    const { result } = renderHook(() => useScanSession('evt_1', mockVideoRef as any));
    
    await act(async () => {
        await result.current.startCamera();
    });
    
    expect(result.current.isScanning).toBe(true);
    
    act(() => {
        result.current.stopCamera();
    });
    
    expect(result.current.isScanning).toBe(false);
  });

  it('handles auth session expiry', () => {
    vi.useFakeTimers();
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
        event: { id: 'evt_1', settings: {} },
        authSession: { role: 'scan', token: 'token', expiresAt: Date.now() - 1000 },
        adapter: {}
    } as any);
    
    const { result } = renderHook(() => useScanSession('evt_1', mockVideoRef as any));
    
    act(() => {
        vi.advanceTimersByTime(1500);
    });
    
    expect(result.current.isExpired).toBe(true);
    vi.useRealTimers();
  });

  it('handles online and offline events', async () => {
    const adapter = {
        getQueuedScanEvents: vi.fn().mockResolvedValue([{ ticketId: 't1' }]),
        saveScanEvent: vi.fn().mockResolvedValue(undefined),
        clearQueuedScanEvents: vi.fn().mockResolvedValue(undefined)
    };
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
        event: { id: 'evt_1', settings: {} },
        authSession: { role: 'scan', token: 'token' },
        adapter
    } as any);
    
    renderHook(() => useScanSession('evt_1', mockVideoRef as any));
    
    await act(async () => {
        window.dispatchEvent(new Event('offline'));
    });
    
    await act(async () => {
        window.dispatchEvent(new Event('online'));
    });
    
    expect(adapter.getQueuedScanEvents).toHaveBeenCalled();
  });
  
  it('scans QR code successfully', async () => {
    vi.useFakeTimers();
    const mockQrParser = vi.fn().mockReturnValue({ data: 'ticket_123' });
    const { result } = renderHook(() => useScanSession('evt_1', mockVideoRef as any, mockQrParser));
    
    await act(async () => {
        await result.current.startCamera();
    });
    
    // Simulate requestAnimationFrame
    await act(async () => {
        vi.advanceTimersByTime(100);
    });
    
    expect(mockQrParser).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('queues scan in offline mode', async () => {
    vi.useFakeTimers();
    const adapter = {
        getQueuedScanEvents: vi.fn().mockResolvedValue([]),
        queueScanEvent: vi.fn().mockResolvedValue(undefined)
    };
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
        event: { id: 'evt_1', settings: {} },
        authSession: { role: 'scan', token: 'token', expiresAt: Date.now() + 10000 },
        adapter
    } as any);
    
    const mockQrParser = vi.fn().mockReturnValue({ data: 'ticket_123' });
    const { result } = renderHook(() => useScanSession('evt_1', mockVideoRef as any, mockQrParser));
    
    // Make it offline
    await act(async () => {
        window.dispatchEvent(new Event('offline'));
    });
    
    await act(async () => {
        await result.current.startCamera();
    });
    
    // Simulate requestAnimationFrame
    await act(async () => {
        vi.advanceTimersByTime(100);
    });
    
    expect(adapter.queueScanEvent).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
