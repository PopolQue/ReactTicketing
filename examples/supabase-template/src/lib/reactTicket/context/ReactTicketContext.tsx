import React, { createContext, useReducer, ReactNode } from 'react';
import { EventConfig } from '../../../reactticket-core/src/types/event.types';
import { StorageAdapter } from '../../../reactticket-core/src/types/adapter.types';
import { AdminSession, ScanSession } from '../../../reactticket-core/src/types/auth.types';
import { TicketTypeConfig, Order, TicketPersonalization, IssuedTicket } from '../../../reactticket-core/src/types/ticket.types';
import { ScanAccount, ScanEvent } from '../../../reactticket-core/src/types/scanAccount.types';
import { PromoCode } from '../../../reactticket-core/src/types/promo.types';
import { reducer } from './reducer';

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
        if (parsedCart && Array.isArray(parsedCart.items)) {
          initialState.cart = parsedCart;
        }
      }
    } catch (e) {
      console.warn("Failed to read cart from sessionStorage", e);
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(reducer, getInitialState());

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
