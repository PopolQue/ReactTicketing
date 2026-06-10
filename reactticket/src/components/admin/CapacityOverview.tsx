import React, { useState, useEffect } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { IssuedTicket } from '../../types/ticket.types';

export const CapacityOverview: React.FC = () => {
  const { ticketTypes, adapter, event } = useReactTicket();
  const [issuedTickets, setIssuedTickets] = useState<IssuedTicket[]>([]);

  useEffect(() => {
    adapter.getIssuedTickets(event.id).then(setIssuedTickets);
  }, [adapter, event.id]);

  const totalPotentialIncome = ticketTypes.reduce((sum, type) => {
    const price = type.pricing.kind === 'paid' ? type.pricing.priceInCents : 0;
    return sum + (type.capacity ?? 0) * price;
  }, 0);

  return (
    <section>
      <h3>Capacity & Potential Sales Overview</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Name</th>
            <th style={{ padding: '10px' }}>Sold / Capacity</th>
            <th style={{ padding: '10px' }}>Potential Income (EUR)</th>
          </tr>
        </thead>
        <tbody>
          {ticketTypes.map((type) => {
            const soldCount = issuedTickets.filter(t => t.ticketTypeId === type.id).length;
            const price = type.pricing.kind === 'paid' ? type.pricing.priceInCents : 0;
            const potentialIncome = (type.capacity ?? 0) * price;

            return (
              <tr key={type.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>{type.name}</td>
                <td style={{ padding: '10px' }}>{soldCount} / {type.capacity ?? '∞'}</td>
                <td style={{ padding: '10px' }}>{(potentialIncome / 100).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '8px' }}>
        <strong>Grand Total Potential Income: {(totalPotentialIncome / 100).toFixed(2)} EUR</strong>
      </div>
    </section>
  );
};
