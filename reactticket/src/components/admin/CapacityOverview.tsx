import React, { useState, useEffect } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';

export const CapacityOverview: React.FC = () => {
  const { ticketTypes, adapter, event } = useReactTicket();
  const [issuedCounts, setIssuedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      for (const type of ticketTypes) {
        counts[type.id] = await adapter.countIssuedTickets(type.id, event.id);
      }
      setIssuedCounts(counts);
    };
    fetchCounts();
  }, [adapter, event.id, ticketTypes]);

  const totalPotentialIncome = ticketTypes.reduce((sum, type) => {
    const price = (type.pricing as any)?.priceInCents || 0;
    return sum + (type.capacity ?? 0) * price;
  }, 0);

  return (
    <section role="region" aria-label="Capacity & Potential Sales Overview">
      <h3>Capacity & Potential Sales Overview</h3>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}
        aria-label="Capacity & Potential Sales Overview"
      >
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Name</th>
            <th style={{ padding: '10px', width: '40%' }}>Sold / Capacity</th>
            <th style={{ padding: '10px' }}>Potential Income (EUR)</th>
          </tr>
        </thead>
        <tbody>
          {ticketTypes.map((type) => {
            const soldCount = issuedCounts[type.id] || 0;
            const price = (type.pricing as any)?.priceInCents || 0;
            const potentialIncome = (type.capacity ?? 0) * price;
            const capacity = type.capacity ?? 0;
            const percent = capacity > 0 ? Math.min(100, (soldCount / capacity) * 100) : 0;

            return (
              <tr key={type.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>{String(type.name || '')}</td>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        flex: 1,
                        height: '8px',
                        background: '#e2e8f0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${type.name} capacity utilization: ${percent.toFixed(0)}%`}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: percent >= 100 ? '#ef4444' : '#3b82f6',
                        }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {soldCount} / {capacity > 0 ? capacity : '∞'}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '10px' }}>{(potentialIncome / 100).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '8px' }}>
        <strong>
          Grand Total Potential Income: {String((totalPotentialIncome / 100).toFixed(2))} EUR
        </strong>
      </div>
    </section>
  );
};
