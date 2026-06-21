import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { TicketOverview } from '../TicketOverview';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';
import * as useReactTicketModule from '../../../hooks/useReactTicket';
import { QRGenerator } from 'reactticket-core/services/QRGenerator';

afterEach(cleanup);

// Mock QRGenerator
vi.spyOn(QRGenerator, 'generate').mockReturnValue('data:image/png;base64,mocked');

// Mock dynamically imported modules
const mockDeliverTicket = vi.fn().mockResolvedValue(true);
const mockTransferTicket = vi.fn().mockResolvedValue(true);
vi.mock('reactticket-core/services/AuthService', () => ({
  AuthService: class {},
}));
vi.mock('reactticket-core/services/TicketService', () => ({
  TicketService: class {
    deliverTicket = mockDeliverTicket;
    transferTicket = mockTransferTicket;
  },
}));

describe('TicketOverview Component', () => {
  const mockAdapter = {
    getIssuedTickets: vi.fn(),
    getTicketTypes: vi.fn(),
    countIssuedTickets: vi.fn(),
  };

  const mockEvent = { id: 'evt_1', settings: {} };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      adapter: mockAdapter,
      event: mockEvent,
    } as any);
  });

  it('handles ticket transfer successfully', async () => {
    const mockTickets = [{ id: 't1', status: 'pending_delivery', personalization: {} }];
    mockAdapter.getIssuedTickets.mockResolvedValue(mockTickets);

    render(
      <ReactTicketProvider
        event={mockEvent as any}
        adapter={mockAdapter as any}
        onCheckout={vi.fn()}
      >
        <TicketOverview />
      </ReactTicketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('t1')).toBeDefined();
    });

    const transferButton = screen.getByLabelText('Transfer ticket t1');
    fireEvent.click(transferButton);

    const nameInput = screen.getByLabelText('Recipient Name');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    fireEvent.change(screen.getByLabelText('Recipient Surname'), {
      target: { value: 'New Surname' },
    });
    fireEvent.change(screen.getByLabelText('Recipient Email'), {
      target: { value: 'new@email.com' },
    });
    fireEvent.change(screen.getByLabelText('Recipient Country'), { target: { value: 'US' } });
    fireEvent.change(screen.getByLabelText('Recipient City'), { target: { value: 'NYC' } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockTransferTicket).toHaveBeenCalled();
    });
  });

  it('handles ticket transfer validation error', async () => {
    const mockTickets = [{ id: 't1', status: 'pending_delivery', personalization: {} }];
    mockAdapter.getIssuedTickets.mockResolvedValue(mockTickets);

    render(
      <ReactTicketProvider
        event={mockEvent as any}
        adapter={mockAdapter as any}
        onCheckout={vi.fn()}
      >
        <TicketOverview />
      </ReactTicketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('t1')).toBeDefined();
    });

    const transferButton = screen.getByLabelText('Transfer ticket t1');
    fireEvent.click(transferButton);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(global.alert).toHaveBeenCalledWith('Please fill in all mandatory fields');
  });

  it('handles ticket transfer failure', async () => {
    mockTransferTicket.mockRejectedValueOnce(new Error('Transfer failed API'));
    const mockTickets = [{ id: 't1', status: 'pending_delivery', personalization: {} }];
    mockAdapter.getIssuedTickets.mockResolvedValue(mockTickets);

    render(
      <ReactTicketProvider
        event={mockEvent as any}
        adapter={mockAdapter as any}
        onCheckout={vi.fn()}
      >
        <TicketOverview />
      </ReactTicketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('t1')).toBeDefined();
    });

    const transferButton = screen.getByLabelText('Transfer ticket t1');
    fireEvent.click(transferButton);

    fireEvent.change(screen.getByLabelText('Recipient Name'), { target: { value: 'New Name' } });
    fireEvent.change(screen.getByLabelText('Recipient Surname'), {
      target: { value: 'New Surname' },
    });
    fireEvent.change(screen.getByLabelText('Recipient Email'), {
      target: { value: 'new@email.com' },
    });
    fireEvent.change(screen.getByLabelText('Recipient Country'), { target: { value: 'US' } });
    fireEvent.change(screen.getByLabelText('Recipient City'), { target: { value: 'NYC' } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Transfer failed: Transfer failed API');
    });
  });

  it('cancels transfer modal', async () => {
    const mockTickets = [{ id: 't1', status: 'pending_delivery', personalization: {} }];
    mockAdapter.getIssuedTickets.mockResolvedValue(mockTickets);

    render(
      <ReactTicketProvider
        event={mockEvent as any}
        adapter={mockAdapter as any}
        onCheckout={vi.fn()}
      >
        <TicketOverview />
      </ReactTicketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('t1')).toBeDefined();
    });

    const transferButton = screen.getByLabelText('Transfer ticket t1');
    fireEvent.click(transferButton);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Transfer Ticket')).toBeNull();
  });

  it('handles ticket delivery successfully', async () => {
    const mockTickets = [{ id: 't1', status: 'pending_delivery', personalization: {} }];
    mockAdapter.getIssuedTickets.mockResolvedValue(mockTickets);

    render(
      <ReactTicketProvider
        event={mockEvent as any}
        adapter={mockAdapter as any}
        onCheckout={vi.fn()}
      >
        <TicketOverview />
      </ReactTicketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('t1')).toBeDefined();
    });

    const deliverButton = screen.getByLabelText('Deliver QR for ticket t1');
    fireEvent.click(deliverButton);

    await waitFor(() => {
      expect(mockDeliverTicket).toHaveBeenCalledWith('t1');
    });
  });

  it('handles ticket delivery failure', async () => {
    mockDeliverTicket.mockRejectedValueOnce(new Error('Delivery error'));
    const mockTickets = [{ id: 't1', status: 'pending_delivery', personalization: {} }];
    mockAdapter.getIssuedTickets.mockResolvedValue(mockTickets);

    render(
      <ReactTicketProvider
        event={mockEvent as any}
        adapter={mockAdapter as any}
        onCheckout={vi.fn()}
      >
        <TicketOverview />
      </ReactTicketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('t1')).toBeDefined();
    });

    const deliverButton = screen.getByLabelText('Deliver QR for ticket t1');
    fireEvent.click(deliverButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Delivery failed: Delivery error');
    });
  });
});
