import React from 'react';
import { TicketTypeConfig } from '../../types/ticket.types';
import { useCart } from '../../hooks/useCart';
import { QuantitySelector } from './QuantitySelector';
import { formatCurrency } from '../../utils/formatCurrency';

export const TicketTypeCard = ({ type }: { type: TicketTypeConfig }) => {
  const { items, addItem, removeItem } = useCart();
  const cartItem = items.find(item => item.ticketTypeId === type.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleQuantityChange = (newQty: number) => {
    if (newQty > quantity) {
      addItem(type.id, newQty - quantity);
    } else if (newQty < quantity) {
        // Simple logic for example: remove one
      removeItem(type.id); 
    }
  };

  const price = type.pricing.kind === 'paid' ? formatCurrency(type.pricing.priceInCents, type.pricing.currency) : 'Free';

  return (
    <div style={{ 
        border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'white', marginBottom: '15px'
    }}>
      <div>
        <h3 style={{ margin: '0 0 5px 0' }}>{type.name}</h3>
        <p style={{ margin: 0, color: '#64748b' }}>{price}</p>
      </div>
      <QuantitySelector value={quantity} onChange={handleQuantityChange} max={type.maxPerOrder || 10} />
    </div>
  );
};
