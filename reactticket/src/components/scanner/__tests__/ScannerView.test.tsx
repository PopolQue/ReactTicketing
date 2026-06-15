import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { ScannerView } from '../ScannerView';
import * as useScanSessionModule from '../../../hooks/useScanSession';
import * as useReactTicketModule from '../../../hooks/useReactTicket';
import * as useScanAuthModule from '../../../hooks/useScanAuth';

afterEach(cleanup);

// Mock reactticket-core and other imports
vi.mock('reactticket-core/utils/jsQR', () => ({
  default: vi.fn()
}));

describe('ScannerView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock ScanSession hook
    vi.spyOn(useScanSessionModule, 'useScanSession').mockReturnValue({
        isScanning: true,
        lastResult: null,
        startCamera: vi.fn(),
        stopCamera: vi.fn(),
        scanManual: vi.fn(),
        setLastResult: vi.fn(),
        isExpired: false
    } as any);

    // Mock ReactTicket hook
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      event: { id: 'evt_1' },
      authSession: { role: 'scan' }
    } as any);

    // Mock ScanAuth hook
    vi.spyOn(useScanAuthModule, 'useScanAuth').mockReturnValue({
        logout: vi.fn()
    } as any);
  });

  it('renders scanner correctly when authenticated', () => {
    render(<ScannerView />);
    expect(screen.getByRole('region', { name: 'Ticket Scanner View' })).toBeDefined();
    expect(screen.getByLabelText('Camera feed for scanning tickets')).toBeDefined();
  });
});
