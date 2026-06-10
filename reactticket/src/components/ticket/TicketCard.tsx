import React from 'react';
import { IssuedTicket } from 'reactticket-core/types/ticket.types';
import { QRCode } from './QRCode';
import { TicketDownload } from './TicketDownload';

export const TicketCard = ({ ticket, eventName }: { ticket: IssuedTicket, eventName: string }) => {
  return (
    <div className="tf-ticket-card">
      <h2>{eventName}</h2>
      <p>Ticket ID: {ticket.id}</p>
      <QRCode payload={ticket.qrPayload} />
      <TicketDownload ticket={ticket} eventName={eventName} />
    </div>
  );
};
