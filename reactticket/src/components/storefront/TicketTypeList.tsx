import React, { useEffect } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { TicketTypeCard } from './TicketTypeCard';
import { OrderSummary } from './OrderSummary';
import { PromoCodeInput } from './PromoCodeInput';
import { CheckoutButton } from './CheckoutButton';
import { Cart } from './Cart';
import { BuyerInfoForm } from './BuyerInfoForm';

export const TicketTypeList = () => {
  const { ticketTypes, adapter, event, dispatch } = useReactTicket();

  const visibleTypes = ticketTypes.filter(t => t.visible);

  useEffect(() => {
    const loadTypes = async () => {
      const types = await adapter.getTicketTypes(event.id);
      dispatch({ type: 'SET_TICKET_TYPES', payload: types });
    };
    loadTypes();
  }, [adapter, event.id, dispatch]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Available Tickets</h2>
      <div style={{ marginBottom: '20px' }}>
        {visibleTypes.map(type => (
          <TicketTypeCard key={type.id} type={type} />
        ))}
      </div>
      <PromoCodeInput />
      <BuyerInfoForm />
      <Cart />
      <OrderSummary />
      <CheckoutButton />
    </div>
  );
};
