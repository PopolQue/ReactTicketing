import { useState, useCallback } from 'react';
import { useReactTicket } from './useReactTicket';

export const useVoucher = () => {
  const { adapter, dispatch, promoDetails, cart } = useReactTicket();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyVoucher = useCallback(
    async (code: string) => {
      setIsLoading(true);
      setError(null);

      if (cart.promoCode === code) {
        setError('Promo code already applied');
        setIsLoading(false);
        return false;
      }

      try {
        const promo = await adapter.getPromoCode(code);
        if (
          !promo ||
          !promo.active ||
          (promo.maxUses !== undefined && promo.usedCount >= promo.maxUses)
        ) {
          setError('Promo code invalid or expired');
          dispatch({ type: 'SET_PROMO_DETAILS', payload: null });
          dispatch({ type: 'CLEAR_PROMO' });
          return false;
        } else {
          dispatch({ type: 'SET_PROMO_CODE', payload: code });
          dispatch({ type: 'SET_PROMO_DETAILS', payload: promo });
          return true;
        }
      } catch (e) {
        setError('An unexpected error occurred.');
        console.error(e);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [adapter, dispatch, cart.promoCode]
  );

  const removeVoucher = useCallback(() => {
    dispatch({ type: 'CLEAR_PROMO' });
    dispatch({ type: 'SET_PROMO_DETAILS', payload: null });
  }, [dispatch]);

  return {
    promoDetails,
    isLoading,
    error,
    applyVoucher,
    removeVoucher,
  };
};
