import { useReactTicket } from './useReactTicket';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { PromoService } from '../services/PromoService';
import { PromoCode } from '../types/promo.types';
import { Order } from '../types/ticket.types';

export const useCart = () => {
  const { cart, dispatch, ticketTypes, adapter, event, onCheckout } = useReactTicket();

  const addItem = useCallback((ticketTypeId: string, quantity: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { ticketTypeId, quantity } });
  }, [dispatch]);

  const removeItem = useCallback((ticketTypeId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { ticketTypeId } });
  }, [dispatch]);

  const setPromoCode = useCallback(async (code: string) => {
    // Prevent applying the same code if it's already in the cart
    if (cart.promoCode === code) {
        alert("Promo code already applied");
        return { valid: false };
    }

    const promo = await adapter.getPromoCode(code);
    // Enforce active and maxUses
    if (!promo || !promo.active || (promo.maxUses !== undefined && promo.usedCount >= promo.maxUses)) {
        alert("Promo code invalid or expired");
        return { valid: false };
    }

    dispatch({ type: 'SET_PROMO_CODE', payload: code });
    
    if (promo.discount.kind === 'free' && promo.appliesTo && promo.appliesTo.length > 0) {
        const type = ticketTypes.find(t => t.id === promo.appliesTo![0]);
        if (type) {
            addItem(type.id, 1);
        }
    }
    return { valid: true };
  }, [dispatch, adapter, addItem, ticketTypes, cart.promoCode]);

  const clearPromo = useCallback(() => {
    dispatch({ type: 'CLEAR_PROMO' });
  }, [dispatch]);

  const [promoDetails, setPromoDetails] = useState<PromoCode | null>(null);

  useEffect(() => {
    if (cart.promoCode) {
      adapter.getPromoCode(cart.promoCode).then(setPromoDetails);
    } else {
      setPromoDetails(null);
    }
  }, [cart.promoCode, adapter]);

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let promoApplied = false;

    cart.items.forEach(item => {
        const type = ticketTypes.find(t => t.id === item.ticketTypeId);
        if (type && type.pricing.kind === 'paid') {
            const itemTotal = type.pricing.priceInCents * item.quantity;
            subtotal += itemTotal;
            
            if (promoDetails && promoDetails.active && !promoApplied) {
                if (promoDetails.discount.kind === 'percent_off') {
                    discount = itemTotal * (promoDetails.discount.percent / 100);
                } else if (promoDetails.discount.kind === 'amount_off') {
                    discount = promoDetails.discount.amountCents;
                }
                promoApplied = true;
            }
        }
    });

    return {
        subtotal: (subtotal / 100).toFixed(2),
        discount: (discount / 100).toFixed(2),
        total: ((subtotal - discount) / 100).toFixed(2)
    };
  }, [cart, ticketTypes, promoDetails]);

  const checkout = useCallback(async () => {
    console.log("Checkout initiated, cart items:", cart.items);
    if (cart.items.length === 0) {
        alert("Cart is empty");
        return;
    }
    const orderId = `ord_${Date.now()}`;
    const order: Order = {
        id: orderId,
        eventId: event.id,
        items: cart.items.map(i => ({
            ticketTypeId: i.ticketTypeId,
            quantity: i.quantity,
            unitPriceBeforeDiscountCents: 0,
            unitPriceCents: 0,
            personalizations: cart.personalizations[i.ticketTypeId] || []
        })),
        buyerEmail: cart.personalizations[cart.items[0]?.ticketTypeId]?.[0]?.email || '', // Simplified: take email from first ticket
        promoCode: cart.promoCode,
        subtotalCents: parseInt(cartTotals.subtotal) * 100,
        discountCents: parseInt(cartTotals.discount) * 100,
        totalCents: parseInt(cartTotals.total) * 100,
        status: 'pending',
        createdAt: new Date(),
    };


    console.log("Creating order:", order);
    await adapter.createOrder(order);

    if (onCheckout) {
        console.log("Calling onCheckout...");
        const result = await onCheckout(order);
        console.log("onCheckout result:", result);
        if (result === 'confirmed') {
            await adapter.updateOrderStatus(orderId, 'confirmed');

            if (cart.promoCode) {
                await adapter.incrementPromoUsage(cart.promoCode);
                clearPromo();
            }
            alert('Checkout successful!');
        } else {
            console.warn("Checkout not confirmed");
        }
    } else {
        console.error("onCheckout prop missing");
    }
  }, [cart, adapter, onCheckout, event.id, cartTotals, clearPromo]);


  return {
    items: cart.items,
    addItem,
    removeItem,
    setPromoCode,
    clearPromo,
    checkout,
    totals: cartTotals
  };
};
