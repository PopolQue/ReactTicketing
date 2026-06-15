import React, { createContext, useContext, useMemo } from 'react';

export type Dictionary = Record<string, string>;

export interface I18nContextValue {
  locale: string;
  dictionary: Dictionary;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const defaultDictionary: Dictionary = {
  'store.cart.title': 'Your Cart',
  'store.cart.empty': 'Your cart is empty',
  'store.cart.subtotal': 'Subtotal',
  'store.cart.discount': 'Discount',
  'store.cart.total': 'Total',
  'store.tickets.title': 'Available Tickets',
  'store.order.summary': 'Order Summary',
  'store.checkout.button': 'Checkout',
  'store.checkout.processing': 'Processing...',
  'store.ticket.free': 'Free',
  'store.ticket.soldOut': 'Sold Out',
  'store.promo.label': 'Promo code',
  'store.promo.apply': 'Apply',
  'store.promo.applying': 'Applying...',
  'store.voucher.label': 'Voucher code',
  'store.voucher.apply': 'Apply',
  'store.voucher.applying': 'Applying...',
  'buyer.personalization': 'Ticket Personalization',
  'buyer.name': 'Name',
  'buyer.surname': 'Surname',
  'buyer.email': 'Email',
  'buyer.country': 'Country',
  'buyer.city': 'City',
  'buyer.phone': 'Phone (Optional)',
  'buyer.zip': 'ZIP (Optional)',
};

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  locale?: string;
  dictionary?: Dictionary;
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  locale = 'en-US',
  dictionary = defaultDictionary,
  children,
}) => {
  const value = useMemo(() => {
    const t = (key: string, replacements?: Record<string, string | number>) => {
      let str = dictionary[key] || defaultDictionary[key] || key;
      if (replacements) {
        Object.entries(replacements).forEach(([k, v]) => {
          str = str.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
        });
      }
      return str;
    };
    return { locale, dictionary, t };
  }, [locale, dictionary]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: 'en-US',
      dictionary: defaultDictionary,
      t: (key: string) => defaultDictionary[key] || key,
    };
  }
  return context;
};
