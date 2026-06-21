import React from 'react';
import { PDFRenderer } from 'reactticket-core/services/PDFRenderer';
import { IssuedTicket } from 'reactticket-core/types/ticket.types';

export const TicketDownload = ({
  ticket,
  eventName,
}: {
  ticket: IssuedTicket;
  eventName: string;
}) => {
  const handleDownload = async () => {
    const blob = await PDFRenderer.render(ticket.id, eventName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      onClick={handleDownload}
      className="tf-ticket-download"
      aria-label={`Download ticket ${ticket.id} for ${eventName}`}
    >
      Download Ticket
    </button>
  );
};
