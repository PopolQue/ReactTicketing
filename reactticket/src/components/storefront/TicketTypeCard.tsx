import React, { useEffect, useState } from 'react';
import { TicketTypeConfig } from 'reactticket-core/types/ticket.types';
import { useCart } from '../../hooks/useCart';
import { useReactTicket } from '../../hooks/useReactTicket';
import { QuantitySelector } from './QuantitySelector';
import { formatCurrency } from 'reactticket-core/utils/formatCurrency';

export const TicketTypeCard = ({ type }: { type: TicketTypeConfig }) => {
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
  }, [adapter, type]);

  const cartItem = items.find(item => item.ticketTypeId === type.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleQuantityChange = (newQty: number) => {
    if (newQty > quantity) {
      addItem(type.id, newQty - quantity);
    } else if (newQty < quantity) {
      removeItem(type.id); 
    }
  };

  const price = type.pricing.kind === 'paid' ? formatCurrency(type.pricing.priceInCents, type.pricing.currency) : 'Free';

  if (loading) return <div>Loading...</div>;

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
};
