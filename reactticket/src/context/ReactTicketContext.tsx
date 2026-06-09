import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { EventConfig } from '../types/event.types';
import { StorageAdapter } from '../types/adapter.types';
import { AdminSession, ScanSession } from '../types/auth.types';
import { TicketTypeConfig, Order, TicketPersonalization } from '../types/ticket.types';
import { ScanAccount, ScanEvent } from '../types/scanAccount.types';

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
  ticketTypes: TicketTypeConfig[];
  scanAccounts: ScanAccount[];
  scanState: ScanState;
  dispatch: React.Dispatch<any>;
  onCheckout: (order: Order) => Promise<"confirmed" | "cancelled">;
}


export const ReactTicketContext = createContext<ReactTicketContextValue | undefined>(undefined);

export const ReactTicketProvider = ({
  children,
  event,
  adapter,
  onCheckout
}: {
  children: ReactNode,
  event: EventConfig,
  adapter: StorageAdapter,
  onCheckout: (order: Order) => Promise<"confirmed" | "cancelled">
}) => {
  // Simple reducer for now
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
  }, {
    event,
    adapter,
    authSession: null,
    cart: { items: [], personalizations: {} },
    ticketTypes: [],
    scanAccounts: [],
    scanState: { isScanning: false, lastResult: null }
  });

  return (
    <ReactTicketContext.Provider value={{ ...state, dispatch, onCheckout }}>
      {children}
    </ReactTicketContext.Provider>
  );
};
