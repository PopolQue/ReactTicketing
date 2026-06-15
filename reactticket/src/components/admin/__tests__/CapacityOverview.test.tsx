import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CapacityOverview } from '../CapacityOverview';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';
import { useReactTicket } from '../../../hooks/useReactTicket';

// Remove the mock of useReactTicket hook

const mockContext = {
  event: { id: 'evt_1', settings: { scanSessionSecret: 's', qrSigningSecret: 'q' } },
  adapter: { 
    name: 'memory',
    countIssuedTickets: vi.fn().mockImplementation((id: string) => {
      if (id === 't1') return Promise.resolve(10);
      if (id === 't2') return Promise.resolve(50);
      return Promise.resolve(0);
    })
  },
  ticketTypes: [
    { id: 't1', name: 'Standard', pricing: { kind: 'paid', priceInCents: 1000, currency: 'EUR' }, capacity: 100 },
    { id: 't2', name: 'VIP', pricing: { kind: 'paid', priceInCents: 2000, currency: 'EUR' }, capacity: 50 }
  ],
  onCheckout: vi.fn(),
} as any;

describe('CapacityOverview Component', () => {
  it('renders correctly', async () => {
    render(
      <ReactTicketProvider {...mockContext}>
        <TestComponent />
      </ReactTicketProvider>
    );

    expect(screen.getByText('Capacity & Potential Sales Overview')).toBeDefined();

    // Check progress bars/sold counts
    await waitFor(() => {
        expect(screen.getByText('Standard')).toBeDefined();
        expect(screen.getByText('VIP')).toBeDefined();
        expect(screen.getByText('10 / 100')).toBeDefined();
        expect(screen.getByText('50 / 50')).toBeDefined();
    });
  });
});

const TestComponent = () => {
    const { dispatch } = useReactTicket();
    useEffect(() => {
        dispatch({ type: 'SET_TICKET_TYPES', payload: mockContext.ticketTypes });
    }, [dispatch]);
    return <CapacityOverview />;
}

