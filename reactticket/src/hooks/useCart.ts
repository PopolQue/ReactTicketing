import { useReactTicket } from './useReactTicket';
import { useCallback } from 'react';
import { useCartTotals } from '../utils/useCartTotals';
import { useCheckout } from './useCheckout';

export const useCart = () => {
  const { cart, dispatch, ticketTypes, promoDetails } = useReactTicket();

  const addItem = useCallback(
    (ticketTypeId: string, quantity: number) => {
      dispatch({ type: 'ADD_ITEM', payload: { ticketTypeId, quantity } });
    },
    [dispatch]
  );

  const removeItem = useCallback(
    (ticketTypeId: string) => {
      dispatch({ type: 'REMOVE_ITEM', payload: { ticketTypeId } });
    },
    [dispatch]
  );

  const cartTotals = useCartTotals(cart.items, ticketTypes, promoDetails);

  const { checkout } = useCheckout(cartTotals);

  return {
    items: cart.items,
    addItem,
    removeItem,
    checkout,
    totals: cartTotals,
  };
};
