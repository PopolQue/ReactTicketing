import { useCallback } from 'react';
import { useReactTicket } from './useReactTicket';
import { Order } from 'reactticket-core/types/ticket.types';
import { AuthService } from 'reactticket-core/services/AuthService';
import { TicketService } from 'reactticket-core/services/TicketService';
import { PDFRenderer } from 'reactticket-core/services/PDFRenderer';

export const useCheckout = (cartTotals: { subtotalCents: number, discountCents: number, totalCents: number }) => {
  const { cart, dispatch, ticketTypes, adapter, event, onCheckout, onTicketIssued } = useReactTicket();

  const checkout = useCallback(async () => {
    if (cart.items.length === 0) {
        alert("Cart is empty");
        return;
    }
    // 1. Final Capacity Check
    for (const item of cart.items) {
        const ticketType = ticketTypes.find(t => t.id === item.ticketTypeId);
        if (ticketType && ticketType.capacity !== undefined) {
            const issuedCount = await adapter.countIssuedTickets(item.ticketTypeId, event.id);
            if (issuedCount + item.quantity > ticketType.capacity) {
                alert(`Sorry, ${ticketType.name} is now sold out or doesn't have enough capacity for your order.`);
                return;
            }
        }
    }

    const orderId = `ord_${Date.now()}`;
    const order: Order = {
        id: orderId,
        eventId: event.id,
        items: cart.items.map(i => {
            const type = ticketTypes.find(t => t.id === i.ticketTypeId);
            const price = (type && type.pricing.kind === 'paid') ? type.pricing.priceInCents : 0;
            return {
                ticketTypeId: i.ticketTypeId,
                quantity: i.quantity,
                unitPriceBeforeDiscountCents: price,
                unitPriceCents: price,
                personalizations: cart.personalizations[i.ticketTypeId] || []
            }
        }),
        buyerEmail: cart.personalizations[cart.items[0]?.ticketTypeId]?.[0]?.email || '',
        promoCode: cart.promoCode,
        subtotalCents: cartTotals.subtotalCents,
        discountCents: cartTotals.discountCents,
        totalCents: cartTotals.totalCents,
        status: 'pending',
        createdAt: new Date(),
    };

    // REMOVED: await adapter.createOrder(order); // Do not insert until payment is confirmed

    if (onCheckout) {
        const result = await onCheckout(order);
        
        if (result === 'confirmed') {
            try {
                const authService = new AuthService(adapter, event.settings);
                const ticketService = new TicketService(adapter, authService);
                
                // 1. Pre-generate tickets in memory without saving
                const issuedTickets = await ticketService.prepareTickets(order);

                // 2. Atomic save of Order + Tickets
                if (adapter.createCheckoutTransaction) {
                    await adapter.createCheckoutTransaction(order, issuedTickets);
                } else {
                    await adapter.createOrder(order);
                    await adapter.saveTickets(issuedTickets);
                    await adapter.updateOrderStatus(order.id, 'confirmed');
                }

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
            }
        }
    } else {
        console.error("onCheckout prop missing");
    }
  }, [cart, ticketTypes, adapter, onCheckout, event, cartTotals, dispatch, onTicketIssued]);

  return { checkout };
};
