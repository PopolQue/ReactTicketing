import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TicketTypeCard } from '../TicketTypeCard';

afterEach(cleanup);

// Mock the hooks
vi.mock('../../../hooks/useCart', () => ({
  useCart: () => ({
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useReactTicket', () => ({
  useReactTicket: () => ({
    adapter: {
      countIssuedTickets: vi.fn().mockResolvedValue(5),
    },
    event: { id: 'evt_1' },
  }),
}));

describe('TicketTypeCard', () => {
  const mockType = {
    id: 'type_1',
    name: 'General Admission',
    pricing: { kind: 'paid', priceInCents: 2500, currency: 'USD' },
    maxPerOrder: 4,
    capacity: 10
  } as any;

  it('renders loading state initially', () => {
    render(<TicketTypeCard type={mockType} />);
    expect(screen.getByRole('status', { name: 'Loading ticket type' })).toBeDefined();
  });

  it('renders ticket type information after loading', async () => {
    render(<TicketTypeCard type={mockType} />);

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Loading ticket type' })).toBeNull();
    });

    expect(screen.getByText('General Admission')).toBeDefined();
    expect(screen.getByText('$25.00')).toBeDefined();
  });

  it('displays Sold Out if capacity is reached', async () => {
    const soldOutType = { ...mockType, capacity: 5 }; // We mocked countIssuedTickets to return 5
    render(<TicketTypeCard type={soldOutType} />);
    
    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Loading ticket type' })).toBeNull();
    });

    expect(screen.getByText('General Admission (Sold Out)')).toBeDefined();
    expect(screen.queryByRole('spinbutton')).toBeNull(); // QuantitySelector should be hidden
  });
});
