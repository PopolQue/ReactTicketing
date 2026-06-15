import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAnalytics } from '../useAnalytics';
import * as useReactTicketModule from '../useReactTicket';
import { ScanService } from 'reactticket-core/services/ScanService';
import { AuthService } from 'reactticket-core/services/AuthService';

const mockGetAnalytics = vi.fn();

vi.mock('reactticket-core/services/ScanService', () => {
    class MockScanService {
        getAnalytics = mockGetAnalytics;
    }
    return { ScanService: MockScanService };
});
vi.mock('reactticket-core/services/AuthService', () => {
    class MockAuthService {}
    return { AuthService: MockAuthService };
});

describe('useAnalytics', () => {
  const mockEvent = { id: 'evt_1', settings: {} };

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      event: mockEvent,
      adapter: {}
    } as any);
  });

  it('fetches analytics summary', async () => {
    const mockSummary = { totalAdmitted: 5 };
    mockGetAnalytics.mockResolvedValue(mockSummary);
    
    const { result } = renderHook(() => useAnalytics('evt_1'));
    
    // Initial load
    await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.summary).toEqual(mockSummary);
    expect(mockGetAnalytics).toHaveBeenCalledWith('evt_1');
  });
});
