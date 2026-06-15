import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { ScanDashboard } from '../ScanDashboard';
import * as useReactTicketModule from '../../../hooks/useReactTicket';
import * as useAnalyticsModule from '../../../hooks/useAnalytics';

afterEach(cleanup);

describe('ScanDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      event: { id: 'evt_1' },
      adapter: {}
    } as any);
  });

  it('renders loading state', () => {
    vi.spyOn(useAnalyticsModule, 'useAnalytics').mockReturnValue({
        summary: null,
        isLoading: true,
        error: null
    } as any);

    render(<ScanDashboard />);
    expect(screen.getByLabelText('Loading scan dashboard')).toBeDefined();
  });

  it('renders dashboard with data', () => {
    const mockSummary = { total: 100 };
    vi.spyOn(useAnalyticsModule, 'useAnalytics').mockReturnValue({
        summary: mockSummary,
        isLoading: false,
        error: null
    } as any);

    render(<ScanDashboard />);
    expect(screen.getByText('Scan Dashboard')).toBeDefined();
    expect(screen.getByText(`Data: ${JSON.stringify(mockSummary)}`)).toBeDefined();
  });
});
