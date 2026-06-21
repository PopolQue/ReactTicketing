import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { ScanDashboard } from '../ScanDashboard';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';
import * as useReactTicketModule from '../../../hooks/useReactTicket';
import * as useAnalyticsModule from '../../../hooks/useAnalytics';

afterEach(cleanup);

describe('ScanDashboard Component', () => {
  const mockAdapter = {};
  const mockEvent = { id: 'evt_1' };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      adapter: mockAdapter,
      event: mockEvent,
    } as any);
  });

  it('renders loading state', () => {
    vi.spyOn(useAnalyticsModule, 'useAnalytics').mockReturnValue({
      summary: null,
      isLoading: true,
      error: null,
      refresh: vi.fn(),
    } as any);

    render(<ScanDashboard />);
    expect(screen.getByLabelText('Loading analytics...')).toBeDefined();
  });

  it('renders dashboard with data', () => {
    vi.spyOn(useAnalyticsModule, 'useAnalytics').mockReturnValue({
      summary: {
        totalAdmitted: 10,
        totalIssued: 100,
        duplicateScanCount: 1,
        invalidScanCount: 2,
        scanVelocity: [],
        admissionRateByTicketType: {},
        scansPerAccount: {},
        clockSkewAnomalies: 0,
      },
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    } as any);

    render(<ScanDashboard />);
    expect(screen.getByText('Live Scan Dashboard')).toBeDefined();
    expect(screen.getByText('10 / 100')).toBeDefined();
  });
});
