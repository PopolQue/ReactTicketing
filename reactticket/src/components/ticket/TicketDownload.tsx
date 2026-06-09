import React from 'react';
import { PDFRenderer } from '../../services/PDFRenderer';
import { IssuedTicket } from '../../types/ticket.types';

export const TicketDownload = ({ ticket, eventName }: { ticket: IssuedTicket, eventName: string }) => {
  const handleDownload = async () => {
    const blob = await PDFRenderer.render(ticket.id, eventName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return <button onClick={handleDownload} className="tf-ticket-download">Download Ticket</button>;
};
