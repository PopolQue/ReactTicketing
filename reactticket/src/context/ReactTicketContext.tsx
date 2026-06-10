import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { EventConfig } from '../types/event.types';
import { StorageAdapter } from '../types/adapter.types';
import { AdminSession, ScanSession } from '../types/auth.types';
import { TicketTypeConfig, Order, TicketPersonalization, IssuedTicket } from '../types/ticket.types';
import { ScanAccount, ScanEvent } from '../types/scanAccount.types';
import { PromoCode } from '../types/promo.types';

export interface CartItem {
  ticketTypeId: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  promoCode?: string;
  personalizations: Record<string, TicketPersonalization[]>;
}

export interface ScanState {
  isScanning: boolean;
  lastResult: ScanEvent | null;
}

export interface ReactTicketContextValue {
  event: EventConfig;
  adapter: StorageAdapter;
  authSession: AdminSession | ScanSession | null;
  cart: CartState;
  promoDetails: PromoCode | null;
  ticketTypes: TicketTypeConfig[];
  scanAccounts: ScanAccount[];
  scanState: ScanState;
  dispatch: React.Dispatch<any>;
  onCheckout: (order: Order) => Promise<"confirmed" | "cancelled">;
  onTicketIssued?: (ticket: IssuedTicket, assets: any) => void;
}


export const ReactTicketContext = createContext<ReactTicketContextValue | undefined>(undefined);

export const ReactTicketProvider = ({
  children,
  event,
  adapter,
  onCheckout,
  onTicketIssued
}: {
  children: ReactNode,
  event: EventConfig,
  adapter: StorageAdapter,
  onCheckout: (order: Order) => Promise<"confirmed" | "cancelled">,
  onTicketIssued?: (ticket: IssuedTicket, assets: any) => void,
}) => {
  const getInitialState = () => {
    const initialState = {
      event,
      adapter,
      authSession: null,
      cart: { items: [], personalizations: {}, promoCode: undefined },
      promoDetails: null,
      ticketTypes: [],
      scanAccounts: [],
      scanState: { isScanning: false, lastResult: null }
    };
    try {
      const storedCart = sessionStorage.getItem(`tf_cart_${event.id}`);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        // Basic validation to ensure it's a cart object
        if (parsedCart && Array.isArray(parsedCart.items)) {
          initialState.cart = parsedCart;
        }
      }
    } catch (e) {
      console.warn("Failed to read cart from sessionStorage", e);
    }
    return initialState;
  };

  const [state, dispatch] = useReducer((state: any, action: any) => {
    switch (action.type) {
      case 'SET_AUTH_SESSION':
        return { ...state, authSession: action.payload };
      case 'SET_TICKET_TYPES':
        return { ...state, ticketTypes: action.payload };
      case 'ADD_ITEM': {
        const { ticketTypeId, quantity } = action.payload;
        const existingItem = state.cart.items.find((i: CartItem) => i.ticketTypeId === ticketTypeId);
        const items = existingItem
          ? state.cart.items.map((i: CartItem) => i.ticketTypeId === ticketTypeId ? { ...i, quantity: i.quantity + quantity } : i)
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
              [action.payload.ticketTypeId]: action.payload.personalizations
            }
          }
        };
      default:
        return state;
    }
  }, getInitialState());

  React.useEffect(() => {
    try {
      sessionStorage.setItem(`tf_cart_${event.id}`, JSON.stringify(state.cart));
    } catch (e) {
      console.warn("Failed to save cart to sessionStorage", e);
    }
  }, [state.cart, event.id]);

  return (
    <ReactTicketContext.Provider value={{ ...state, dispatch, onCheckout, onTicketIssued }}>
      {children}
    </ReactTicketContext.Provider>
  );
};
