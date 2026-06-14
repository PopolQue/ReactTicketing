import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TicketCard } from '../TicketCard';

afterEach(cleanup);

vi.mock('../QRCode', () => ({
  QRCode: ({ payload }: { payload: string }) => <div data-testid="qrcode">{payload}</div>
}));
vi.mock('../TicketDownload', () => ({
  TicketDownload: ({ ticket, eventName }: any) => <div data-testid="ticket-download">Download {eventName}</div>
}));

describe('TicketCard', () => {
  const mockTicket = {
    id: 'tkt_123',
    typeId: 'type_1',
    status: 'issued',
    issuedAt: Date.now(),
    qrPayload: 'qr_payload_123'
  } as any;

  it('renders ticket information correctly', () => {
    render(<TicketCard ticket={mockTicket} eventName="Concert" />);
    expect(screen.getByText('Concert')).toBeDefined();
    expect(screen.getByText('Ticket ID: tkt_123')).toBeDefined();
    expect(screen.getByTestId('qrcode')).toBeDefined();
    expect(screen.getByTestId('ticket-download')).toBeDefined();
  });

  it('renders pending message when qrPayload is empty', () => {
    const ticketWithoutQR = { ...mockTicket, qrPayload: undefined };
    render(<TicketCard ticket={ticketWithoutQR} eventName="Concert" />);
    expect(screen.getByText('QR Code will be generated closer to the event.')).toBeDefined();
    expect(screen.queryByTestId('qrcode')).toBeNull();
  });
});
