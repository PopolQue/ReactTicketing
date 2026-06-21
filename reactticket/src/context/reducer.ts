import { CartItem, CartState, ReactTicketState } from './ReactTicketContext';
import { TicketTypeConfig, TicketPersonalization } from 'reactticket-core/types/ticket.types';
import { AdminSession, ScanSession } from 'reactticket-core/types/auth.types';
import { PromoCode } from 'reactticket-core/types/promo.types';

export type Action =
  | { type: 'SET_AUTH_SESSION'; payload: AdminSession | ScanSession | null }
  | { type: 'SET_TICKET_TYPES'; payload: TicketTypeConfig[] }
  | { type: 'ADD_ITEM'; payload: { ticketTypeId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { ticketTypeId: string } }
  | { type: 'SET_PROMO_CODE'; payload: string }
  | { type: 'CLEAR_PROMO' }
  | { type: 'SET_PROMO_DETAILS'; payload: PromoCode | null }
  | {
      type: 'SET_PERSONALIZATION';
      payload: { ticketTypeId: string; personalizations: TicketPersonalization[] };
    };

export const reducer = (state: ReactTicketState, action: Action): ReactTicketState => {
  switch (action.type) {
    case 'SET_AUTH_SESSION':
      return { ...state, authSession: action.payload };
    case 'SET_TICKET_TYPES':
      return { ...state, ticketTypes: action.payload };
    case 'ADD_ITEM': {
      const { ticketTypeId, quantity } = action.payload;
      const existingItem = state.cart.items.find((i: CartItem) => i.ticketTypeId === ticketTypeId);
      const items = existingItem
        ? state.cart.items.map((i: CartItem) =>
            i.ticketTypeId === ticketTypeId ? { ...i, quantity: i.quantity + quantity } : i
          )
        : [...state.cart.items, { ticketTypeId, quantity }];
      return { ...state, cart: { ...state.cart, items } };
    }
    case 'REMOVE_ITEM': {
      const { ticketTypeId } = action.payload;
      const items = state.cart.items.filter((i: CartItem) => i.ticketTypeId !== ticketTypeId);
      return { ...state, cart: { ...state.cart, items } };
    }
    case 'SET_PROMO_CODE':
      return { ...state, cart: { ...state.cart, promoCode: action.payload } };
    case 'CLEAR_PROMO':
      return { ...state, cart: { ...state.cart, promoCode: undefined } };
    case 'SET_PROMO_DETAILS':
      return { ...state, promoDetails: action.payload };
    case 'SET_PERSONALIZATION':
      return {
        ...state,
        cart: {
          ...state.cart,
          personalizations: {
            ...state.cart.personalizations,
            [action.payload.ticketTypeId]: action.payload.personalizations,
          },
        },
      };
    default:
      return state;
  }
};
