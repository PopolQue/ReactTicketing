import React, { useEffect, useState, useCallback } from 'react';
import { TicketTypeConfig } from 'reactticket-core/types/ticket.types';
import { useCart } from '../../hooks/useCart';
import { useReactTicket } from '../../hooks/useReactTicket';
import { QuantitySelector } from './QuantitySelector';
import { formatCurrency } from 'reactticket-core/utils/formatCurrency';

export const TicketTypeCard = React.memo(({ type }: { type: TicketTypeConfig }) => {
  const { items, addItem, removeItem } = useCart();
  const { adapter, event } = useReactTicket();
  const [soldOut, setSoldOut] = useState(false);
  const [remainingCapacity, setRemainingCapacity] = useState(type.maxPerOrder || 10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCapacity = async () => {
        if (type.capacity !== undefined) {
            const issuedCount = await adapter.countIssuedTickets(type.id, event.id);
            const remaining = type.capacity - issuedCount;
            setSoldOut(remaining <= 0);
            
            // Limit by maxPerOrder OR remaining capacity, whichever is smaller
            const maxAllowed = Math.min(type.maxPerOrder || 10, Math.max(0, remaining));
            setRemainingCapacity(maxAllowed);
        }
        setLoading(false);
    };
    checkCapacity();
  }, [adapter, type, event.id]);

  const cartItem = items.find(item => item.ticketTypeId === type.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleQuantityChange = useCallback((newQty: number) => {
    if (newQty > quantity) {
      addItem(type.id, newQty - quantity);
    } else if (newQty < quantity) {
      removeItem(type.id); 
    }
  }, [quantity, type.id, addItem, removeItem]);

  const price = type.pricing.kind === 'paid' ? formatCurrency(type.pricing.priceInCents, type.pricing.currency) : 'Free';

  if (loading) return (
    <div 
      style={{ 
        border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#f8fafc', marginBottom: '15px', animation: 'pulse 1.5s infinite'
      }}
      role="status"
      aria-busy="true"
      aria-label="Loading ticket type"
    >
      <div style={{ flex: 1 }}>
        <div style={{ height: '24px', background: '#e2e8f0', borderRadius: '4px', width: '50%', marginBottom: '8px' }}></div>
        <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '30%' }}></div>
      </div>
      <div style={{ width: '80px', height: '36px', background: '#e2e8f0', borderRadius: '8px' }}></div>
    </div>
  );

  return (
    <div 
      style={{ 
        border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: soldOut ? '#f1f5f9' : 'white', marginBottom: '15px',
        opacity: soldOut ? 0.7 : 1
      }}
      role="region"
      aria-label={`Ticket type: ${type.name}`}
    >
      <div>
        <h3 style={{ margin: '0 0 5px 0' }}>{type.name} {soldOut && '(Sold Out)'}</h3>
        <p style={{ margin: 0, color: '#64748b' }} aria-label={`Price: ${price}`}>{price}</p>
      </div>
      {!soldOut && <QuantitySelector value={quantity} onChange={handleQuantityChange} max={remainingCapacity} itemName={type.name} />}
    </div>
  );
});
