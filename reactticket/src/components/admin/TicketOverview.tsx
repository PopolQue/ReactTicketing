import React, { useEffect, useState } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { IssuedTicket } from 'reactticket-core/types/ticket.types';
import { QRGenerator } from 'reactticket-core/services/QRGenerator';

export const TicketOverview: React.FC = () => {
  const { adapter, event } = useReactTicket();
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);

  useEffect(() => {
    adapter.getIssuedTickets(event.id).then(setTickets);
  }, [adapter, event.id]);

  const [transferTicketId, setTransferTicketId] = useState<string | null>(null);
  const [transferForm, setTransferForm] = useState({ name: '', surname: '', email: '', country: '', city: '' });

  const handleDeliver = async (ticketId: string) => {
    try {
      const { AuthService } = await import('../../services/AuthService');
      const { TicketService } = await import('../../services/TicketService');
      const authService = new AuthService(adapter, (event as any).settings);
      const ticketService = new TicketService(adapter, authService);
      await ticketService.deliverTicket(ticketId);
      adapter.getIssuedTickets(event.id).then(setTickets);
    } catch (e: any) {
      alert("Delivery failed: " + e.message);
    }
  };

  const submitTransfer = async () => {
    if (!transferTicketId) return;
    if (!transferForm.email || !transferForm.name || !transferForm.surname || !transferForm.country || !transferForm.city) {
      alert("Please fill in all mandatory fields");
      return;
    }
    try {
      const { AuthService } = await import('../../services/AuthService');
      const { TicketService } = await import('../../services/TicketService');
      const authService = new AuthService(adapter, (event as any).settings);
      const ticketService = new TicketService(adapter, authService);
      const ticket = tickets.find(t => t.id === transferTicketId);
      const newPerson = { ...ticket?.personalization, ...transferForm } as any;
      await ticketService.transferTicket(transferTicketId, transferForm.email, newPerson);
      adapter.getIssuedTickets(event.id).then(setTickets);
      setTransferTicketId(null);
      setTransferForm({ name: '', surname: '', email: '', country: '', city: '' });
    } catch (e: any) {
      alert("Transfer failed: " + e.message);
    }
  };

  return (
    <section style={{ marginTop: '20px', position: 'relative' }}>
      <h3>Ticket Overview</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '8px' }}>QR Code</th>
            <th style={{ padding: '8px' }}>Ticket ID</th>
            <th style={{ padding: '8px' }}>Buyer</th>
            <th style={{ padding: '8px' }}>Status</th>
            <th style={{ padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px' }}>
                {ticket.qrPayload ? (
                  <img src={QRGenerator.generate(ticket.qrPayload)} alt="QR Code" style={{ width: '50px', height: '50px' }} />
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Pending Delivery</span>
                )}
              </td>
              <td style={{ padding: '8px', fontFamily: 'monospace' }}>{ticket.id}</td>
              <td style={{ padding: '8px' }}>
                {ticket.personalization ? (
                  `${ticket.personalization.name} ${ticket.personalization.surname} (${ticket.personalization.email})`
                ) : (
                  ticket.buyerEmail
                )}
                {ticket.transferHistory && ticket.transferHistory.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    (Transferred {ticket.transferHistory.length} times)
                  </div>
                )}
              </td>
              <td style={{ padding: '8px' }}>
                <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', background: ticket.status === 'delivered' ? '#dcfce7' : '#fee2e2' }}>
                  {ticket.status.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '8px' }}>
                {ticket.status === 'pending_delivery' && (
                  <>
                    <button onClick={() => handleDeliver(ticket.id)} style={{ marginRight: '8px', fontSize: '0.8rem', padding: '4px 8px', cursor: 'pointer' }}>
                      Deliver QR
                    </button>
                    <button onClick={() => setTransferTicketId(ticket.id)} style={{ fontSize: '0.8rem', padding: '4px 8px', cursor: 'pointer' }}>
                      Transfer
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {transferTicketId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Transfer Ticket</h4>
            <input placeholder="Name" value={transferForm.name} onChange={e => setTransferForm({...transferForm, name: e.target.value})} style={{ padding: '8px' }} />
            <input placeholder="Surname" value={transferForm.surname} onChange={e => setTransferForm({...transferForm, surname: e.target.value})} style={{ padding: '8px' }} />
            <input placeholder="Email" type="email" value={transferForm.email} onChange={e => setTransferForm({...transferForm, email: e.target.value})} style={{ padding: '8px' }} />
            <input placeholder="Country" value={transferForm.country} onChange={e => setTransferForm({...transferForm, country: e.target.value})} style={{ padding: '8px' }} />
            <input placeholder="City" value={transferForm.city} onChange={e => setTransferForm({...transferForm, city: e.target.value})} style={{ padding: '8px' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={submitTransfer} style={{ flex: 1, padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirm</button>
              <button onClick={() => setTransferTicketId(null)} style={{ flex: 1, padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
