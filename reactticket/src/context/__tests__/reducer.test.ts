import { describe, it, expect } from 'vitest';
import { reducer } from '../reducer';

describe('reducer', () => {
  const initialState = {
    cart: { items: [], personalizations: {} },
    ticketTypes: [],
    authSession: null,
    promoDetails: null,
  };

  describe('ADD_ITEM', () => {
    it('should add a new item to the cart', () => {
      const action = { type: 'ADD_ITEM', payload: { ticketTypeId: 'gen', quantity: 2 } } as any;
      const state = reducer(initialState as any, action);
      expect(state.cart.items).toHaveLength(1);
      expect(state.cart.items[0]).toEqual({ ticketTypeId: 'gen', quantity: 2 });
    });

    it('should update quantity if item already exists', () => {
      const startState = {
        ...initialState,
        cart: { items: [{ ticketTypeId: 'gen', quantity: 1 }], personalizations: {} },
      };
      const action = { type: 'ADD_ITEM', payload: { ticketTypeId: 'gen', quantity: 2 } } as any;
      const state = reducer(startState as any, action);
      expect(state.cart.items).toHaveLength(1);
      expect(state.cart.items[0].quantity).toBe(3);
    });
  });

  describe('REMOVE_ITEM', () => {
    it('should remove an item from the cart', () => {
      const startState = {
        ...initialState,
        cart: { items: [{ ticketTypeId: 'gen', quantity: 1 }], personalizations: {} },
      };
      const action = { type: 'REMOVE_ITEM', payload: { ticketTypeId: 'gen' } } as any;
      const state = reducer(startState as any, action);
      expect(state.cart.items).toHaveLength(0);
    });
  });

  describe('PROMO_CODE', () => {
    it('should set promo code and details', () => {
      const actionCode = { type: 'SET_PROMO_CODE', payload: 'SUMMER' } as any;
      let state = reducer(initialState as any, actionCode);
      expect(state.cart.promoCode).toBe('SUMMER');

      const actionDetails = {
        type: 'SET_PROMO_DETAILS',
        payload: { code: 'SUMMER', active: true },
      } as any;
      state = reducer(state, actionDetails);
      expect(state.promoDetails!.code).toBe('SUMMER');
    });

    it('should clear promo', () => {
      const startState = {
        ...initialState,
        cart: { items: [], promoCode: 'SUMMER', personalizations: {} },
        promoDetails: { code: 'SUMMER' },
      };
      const action = { type: 'CLEAR_PROMO' } as any;
      const state = reducer(startState as any, action);
      expect(state.cart.promoCode).toBeUndefined();
    });
  });
});
