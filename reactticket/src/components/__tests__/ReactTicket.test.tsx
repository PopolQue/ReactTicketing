import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ReactTicket } from '../ReactTicket';

afterEach(cleanup);

vi.mock('../storefront/TicketTypeList', () => ({
  TicketTypeList: () => <div data-testid="storefront">Storefront</div>
}));
vi.mock('../admin/AdminPanel', () => ({
  AdminPanel: () => <div data-testid="admin">Admin Panel</div>
}));
vi.mock('../scanner/ScannerView', () => ({
  ScannerView: () => <div data-testid="scanner">Scanner View</div>
}));
vi.mock('../admin/TicketOverview', () => ({
  TicketOverview: () => <div data-testid="tickets">Tickets Overview</div>
}));

describe('ReactTicket', () => {
  const mockAdapter = {
    name: 'memory',
    init: vi.fn(),
    getEvent: vi.fn(),
  } as any;

  const mockEvent = {
    id: 'evt_1',
    name: 'Test Event',
    ticketTypes: []
  } as any;

  it('renders storefront by default', () => {
    render(<ReactTicket event={mockEvent} adapter={mockAdapter} onCheckout={vi.fn()} />);
    expect(screen.getByTestId('storefront')).toBeDefined();
  });

  it('renders admin mode', () => {
    render(<ReactTicket mode="admin" event={mockEvent} adapter={mockAdapter} onCheckout={vi.fn()} />);
    expect(screen.getByTestId('admin')).toBeDefined();
  });

  it('renders scanner mode', () => {
    render(<ReactTicket mode="scanner" event={mockEvent} adapter={mockAdapter} onCheckout={vi.fn()} />);
    expect(screen.getByTestId('scanner')).toBeDefined();
  });

  it('renders tickets mode', () => {
    render(<ReactTicket mode="tickets" event={mockEvent} adapter={mockAdapter} onCheckout={vi.fn()} />);
    expect(screen.getByTestId('tickets')).toBeDefined();
  });
});
