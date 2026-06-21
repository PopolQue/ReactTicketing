import { useMemo } from 'react';
import { TicketTypeConfig } from 'reactticket-core/types/ticket.types';
import { CartItem } from '../context/ReactTicketContext';
import { PromoCode } from 'reactticket-core/types/promo.types';

export const useCartTotals = (
  cartItems: CartItem[],
  ticketTypes: TicketTypeConfig[],
  promoDetails: PromoCode | null
) => {
  return useMemo(() => {
    let subtotal = 0;
    cartItems.forEach((item: CartItem) => {
      const type = ticketTypes.find((t) => t.id === item.ticketTypeId);
      if (type && type.pricing.kind === 'paid') {
        subtotal += type.pricing.priceInCents * item.quantity;
      }
    });

    let discount = 0;
    if (promoDetails && promoDetails.active) {
      const applicableItems =
        promoDetails.appliesTo && promoDetails.appliesTo.length > 0
          ? cartItems.filter((item: CartItem) =>
              promoDetails.appliesTo!.includes(item.ticketTypeId)
            )
          : cartItems;

      const applicableSubtotal = applicableItems.reduce((acc: number, item: CartItem) => {
        const type = ticketTypes.find((t) => t.id === item.ticketTypeId);
        if (type && type.pricing.kind === 'paid') {
          return acc + type.pricing.priceInCents * item.quantity;
        }
        return acc;
      }, 0);

      if (promoDetails.discount.kind === 'percent_off') {
        discount = applicableSubtotal * (promoDetails.discount.percent / 100);
      } else if (promoDetails.discount.kind === 'amount_off') {
        discount = Math.min(promoDetails.discount.amountCents, applicableSubtotal);
      }
    }

    const total = subtotal - discount;

    return {
      subtotalCents: subtotal,
      discountCents: discount,
      totalCents: total > 0 ? total : 0,
    };
  }, [cartItems, ticketTypes, promoDetails]);
};
