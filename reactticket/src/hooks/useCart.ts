import { useReactTicket } from './useReactTicket';
import { useCallback, useMemo } from 'react';
import { Order } from '../types/ticket.types';
import { AuthService } from '../services/AuthService';
import { TicketService } from '../services/TicketService';
import { PDFRenderer } from '../services/PDFRenderer';

export const useCart = () => {
  const { cart, dispatch, ticketTypes, adapter, event, onCheckout, promoDetails, onTicketIssued } = useReactTicket();

  const addItem = useCallback((ticketTypeId: string, quantity: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { ticketTypeId, quantity } });
  }, [dispatch]);

  const removeItem = useCallback((ticketTypeId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { ticketTypeId } });
  }, [dispatch]);

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    cart.items.forEach(item => {
        const type = ticketTypes.find(t => t.id === item.ticketTypeId);
        if (type && type.pricing.kind === 'paid') {
            subtotal += type.pricing.priceInCents * item.quantity;
        }
    });

    let discount = 0;
    if (promoDetails && promoDetails.active) {
        const applicableItems = (promoDetails.appliesTo && promoDetails.appliesTo.length > 0)
            ? cart.items.filter(item => promoDetails.appliesTo!.includes(item.ticketTypeId))
            : cart.items;

        const applicableSubtotal = applicableItems.reduce((acc, item) => {
            const type = ticketTypes.find(t => t.id === item.ticketTypeId);
            if (type && type.pricing.kind === 'paid') {
                return acc + type.pricing.priceInCents * item.quantity;
            }
            return acc;
        }, 0);
        
        if (promoDetails.discount.kind === 'percent_off') {
            discount = applicableSubtotal * (promoDetails.discount.percent / 100);
        } else if (promoDetails.discount.kind === 'amount_off') {
            // Cap discount at the applicable subtotal
            discount = Math.min(promoDetails.discount.amountCents, applicableSubtotal);
        }
    }
    
    const total = subtotal - discount;

    return {
        subtotal: (subtotal / 100).toFixed(2),
        discount: (discount / 100).toFixed(2),
        total: (total > 0 ? total / 100 : 0).toFixed(2)
    };
  }, [cart.items, ticketTypes, promoDetails]);

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
        // TODO: The pricing per item does not reflect the discount.
        // This should be handled by the backend based on the promo code.
        items: cart.items.map(i => {
            const type = ticketTypes.find(t => t.id === i.ticketTypeId);
            const price = (type && type.pricing.kind === 'paid') ? type.pricing.priceInCents : 0;
            return {
                ticketTypeId: i.ticketTypeId,
                quantity: i.quantity,
                unitPriceBeforeDiscountCents: price,
                unitPriceCents: price, // This is not correct if a discount is applied
                personalizations: cart.personalizations[i.ticketTypeId] || []
            }
        }),
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
            try {
                const authService = new AuthService(adapter, event.settings);
                const ticketService = new TicketService(adapter, authService);
                const issuedTickets = await ticketService.issueTickets(order.id);

                await adapter.updateOrderStatus(orderId, 'confirmed');

                if (onTicketIssued) {
                    for (const ticket of issuedTickets) {
                        const blob = await PDFRenderer.render(ticket.id, event.name);
                        onTicketIssued(ticket, { png: blob });
                    }
                }

                if (cart.promoCode) {
                    await adapter.incrementPromoUsage(cart.promoCode);
                    dispatch({ type: 'CLEAR_PROMO' });
                    dispatch({ type: 'SET_PROMO_DETAILS', payload: null });
                }
                alert('Checkout successful!');
            } catch (err: any) {
                console.error("Ticket issuance failed:", err);
                alert(`Checkout failed: ${err.message}`);
                // TODO: Revert order status to failed/cancelled if needed
            }
        } else {
            console.warn("Checkout not confirmed");
        }
    } else {
        console.error("onCheckout prop missing");
    }
  }, [cart, ticketTypes, adapter, onCheckout, event, cartTotals, dispatch, onTicketIssued]);


  return {
    items: cart.items,
    addItem,
    removeItem,
    checkout,
    totals: cartTotals,
  };
};
