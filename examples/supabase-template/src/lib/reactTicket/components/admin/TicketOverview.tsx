import React, { useEffect, useState } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { IssuedTicket } from '../../types/ticket.types';
import { QRGenerator } from '../../services/QRGenerator';

export const TicketOverview: React.FC = () => {
  const { adapter, event } = useReactTicket();
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);

  useEffect(() => {
    adapter.getIssuedTickets(event.id).then(setTickets);
  }, [adapter, event.id]);

  return (
    <section style={{ marginTop: '20px' }}>
      <h3>Ticket Overview</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '8px' }}>QR Code</th>
            <th style={{ padding: '8px' }}>Ticket ID</th>
            <th style={{ padding: '8px' }}>Buyer</th>
            <th style={{ padding: '8px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px' }}>
                <img src={QRGenerator.generate(ticket.qrPayload)} alt="QR Code" style={{ width: '50px', height: '50px' }} />
              </td>
              <td style={{ padding: '8px', fontFamily: 'monospace' }}>{ticket.id}</td>
              <td style={{ padding: '8px' }}>
                {ticket.personalization ? (
                  `${ticket.personalization.name} ${ticket.personalization.surname} (${ticket.buyerEmail})`
                ) : (
                  ticket.buyerEmail
                )}
              </td>
              <td style={{ padding: '8px' }}>
                <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', background: ticket.status === 'delivered' ? '#dcfce7' : '#fee2e2' }}>
                  {ticket.status.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
