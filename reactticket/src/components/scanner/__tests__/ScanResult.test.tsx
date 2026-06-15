import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { ScanResult } from '../ScanResult';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';
import * as useReactTicketModule from '../../../hooks/useReactTicket';

afterEach(cleanup);

describe('ScanResult Component', () => {
  const mockAdapter = {
    getTicket: vi.fn(),
    getTicketTypes: vi.fn(),
  };

  const mockEvent = { id: 'evt_1' };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock audio/vibrate
    class MockAudioContext {
        createOscillator = () => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { setValueAtTime: vi.fn() } });
        createGain = () => ({ connect: vi.fn(), gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } });
        currentTime = 0;
        destination = {};
    }
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('navigator', { vibrate: vi.fn() });

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      adapter: mockAdapter,
      event: mockEvent,
      dispatch: vi.fn()
    } as any);
  });

  it('renders admitted state correctly', async () => {
    mockAdapter.getTicket.mockResolvedValue({ 
        id: 't1', 
        ticketTypeId: 'tt1', 
        personalization: { name: 'John', surname: 'Doe' } 
    });
    mockAdapter.getTicketTypes.mockResolvedValue([{ id: 'tt1', name: 'Standard' }]);

    const result = {
        id: 's1',
        ticketId: 't1',
        scannedAt: new Date(),
        scannedByAccountId: 'a1',
        scannedByAccountName: 'crew1',
        result: 'admitted',
        payload: 'qr1',
        clockSkewSeconds: 0,
        location: 'Gate A'
    } as any;

    render(<ScanResult result={result} onDismiss={vi.fn()} />);

    expect(screen.getByText('ADMITTED')).toBeDefined();
    
    // Wait for the ticket data to be loaded
    await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeDefined();
    });
  });
});
