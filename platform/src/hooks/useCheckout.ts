import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useCheckout({ eventId, tiers, cart }: { eventId: string, tiers: any[], cart: { [tierId: string]: number } }) {
  const [checkoutFields, setCheckoutFields] = useState<any[]>([]);
  const [ticketForms, setTicketForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFields() {
      const { data } = await supabase
        .from('event_checkout_fields')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      
      setCheckoutFields(data || []);

      // Build flattened ticket instances based on cart
      const instances: any[] = [];
      Object.keys(cart).forEach(tierId => {
        const qty = cart[tierId];
        const tierObj = tiers.find(t => t.id === tierId);
        for (let i = 0; i < qty; i++) {
          instances.push({
            id: crypto.randomUUID(),
            tier: tierObj,
            answers: {}
          });
        }
      });
      setTicketForms(instances);
      setLoading(false);
    }
    fetchFields();
  }, [eventId, cart, tiers]);

  const handleAnswerChange = (ticketId: string, fieldId: string, value: string) => {
    setTicketForms(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, answers: { ...t.answers, [fieldId]: value } };
      }
      return t;
    }));
  };

  const subtotalCents = ticketForms.reduce((acc, t) => acc + (t.tier.pricing?.amount || 0), 0);

  const executePurchase = async ({
    finalTotalCents,
    onSuccess,
    onError,
    onBeforeComplete
  }: {
    finalTotalCents: number;
    onSuccess: () => void;
    onError: (err: any) => void;
    onBeforeComplete?: () => Promise<void>;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const orderId = crypto.randomUUID();
      const discountCents = subtotalCents - finalTotalCents;

      // Map cart to items for the order
      const orderItems = Object.keys(cart).map(tierId => {
        const tier = tiers.find(t => t.id === tierId);
        return { ticket_type_id: tierId, quantity: cart[tierId], price_cents: tier?.pricing?.amount || 0 };
      });

      const orderData = {
        id: orderId,
        event_id: eventId,
        items: orderItems,
        buyer_email: user.email,
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        total_cents: finalTotalCents,
        status: 'completed'
      };

      // Insert individual tickets with their personalizations
      const ticketsToInsert = ticketForms.map(t => {
        // Build final personalization JSON
        const personalization: any = {};
        checkoutFields.forEach(f => {
          personalization[f.label] = t.answers[f.id] || '';
        });
        // Always include user email as a fallback if not asked
        if (!personalization['Email']) personalization['Email'] = user.email;

        // Distribute price paid proportionally
        const priceRatio = subtotalCents > 0 ? (t.tier.pricing?.amount || 0) / subtotalCents : 0;
        const ticketPricePaid = Math.round(finalTotalCents * priceRatio);

        return {
          id: crypto.randomUUID(),
          event_id: eventId,
          ticket_type_id: t.tier.id,
          order_id: orderId,
          personalization: personalization,
          buyer_email: user.email,
          status: 'valid',
          price_paid_cents: ticketPricePaid,
          owner_id: user.id
        };
      });

      const { error: rpcError } = await supabase.rpc('create_checkout_transaction', {
        p_order: orderData,
        p_tickets: ticketsToInsert
      });

      if (rpcError) throw rpcError;

      if (onBeforeComplete) {
        await onBeforeComplete();
      }

      onSuccess();
    } catch (err: any) {
      onError(err);
    }
  };

  const validateForms = (): boolean => {
    for (const t of ticketForms) {
      for (const f of checkoutFields) {
        if (f.is_required && !t.answers[f.id]) {
          return false;
        }
      }
    }
    return true;
  };

  return {
    loading,
    checkoutFields,
    ticketForms,
    subtotalCents,
    handleAnswerChange,
    validateForms,
    executePurchase
  };
}
