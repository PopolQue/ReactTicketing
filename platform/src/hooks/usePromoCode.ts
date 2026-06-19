import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { usePostHog } from '@posthog/react';

export function usePromoCode(eventId: string) {
  const posthog = usePostHog();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');

  const applyPromo = async () => {
    setPromoError('');
    if (!promoCode) return;
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('event_id', eventId)
      .eq('code', promoCode.toUpperCase())
      .eq('active', true)
      .single();

    if (error || !data) {
      setPromoError('Invalid or expired promo code');
    } else {
      setAppliedPromo(data);
      posthog?.capture('promo_code_applied', {
        event_id: eventId,
        discount_kind: data.discount_kind,
        discount_value: data.discount_value,
      });
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const getDiscountedAmount = (subtotalCents: number) => {
    if (!appliedPromo) return subtotalCents;
    if (appliedPromo.discount_kind === 'percent_off') {
        return Math.max(0, subtotalCents - Math.round(subtotalCents * (appliedPromo.discount_value / 100)));
    } else if (appliedPromo.discount_kind === 'amount_off') {
        return Math.max(0, subtotalCents - appliedPromo.discount_value);
    } else if (appliedPromo.discount_kind === 'free') {
        return 0;
    }
    return subtotalCents;
  };

  const incrementUsage = async () => {
    if (appliedPromo) {
      await supabase.rpc('increment_promo_usage', { p_code: appliedPromo.code, p_event_id: eventId });
    }
  };

  return {
    promoCode,
    setPromoCode,
    appliedPromo,
    promoError,
    applyPromo,
    removePromo,
    getDiscountedAmount,
    incrementUsage
  };
}
