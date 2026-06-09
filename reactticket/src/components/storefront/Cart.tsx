import React from 'react';
import { useCart } from '../../hooks/useCart';
import { useReactTicket } from '../../hooks/useReactTicket';

export const Cart: React.FC = () => {
  const { items, removeItem, totals } = useCart();
  const { ticketTypes } = useReactTicket();

  if (items.length === 0) return null;

  return (
    <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
      <h3>Your Cart</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {items.map(item => {
            const type = ticketTypes.find(t => t.id === item.ticketTypeId);
            return (
              <tr key={item.ticketTypeId}>
                <td style={{ padding: '8px' }}>{type?.name || 'Unknown'}</td>
                <td style={{ padding: '8px' }}>x{item.quantity}</td>
                <td style={{ padding: '8px' }}>
                  <button onClick={() => removeItem(item.ticketTypeId)} style={{ color: 'red' }}>Remove</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: '10px', textAlign: 'right' }}>
        <strong>Total: {totals.total} EUR</strong>
      </div>
    </div>
  );
};
