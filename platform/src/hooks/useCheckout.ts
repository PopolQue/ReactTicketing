import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

export function useCheckout({
  eventId,
  tiers,
  cart,
  guestEmail,
}: {
  eventId: string;
  tiers: any[];
  cart: { [tierId: string]: number };
  guestEmail?: string;
}) {
  const [user, setUser] = useState<any>(null);
  const [checkoutFields, setCheckoutFields] = useState<any[]>([]);
  const [ticketForms, setTicketForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function init() {
      const result = await supabase.auth.getUser();
      const currentUser = result?.data?.user || null;
      setUser(currentUser);

      const { data: checkoutData } = await supabase
        .from('event_checkout_fields')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      setCheckoutFields(checkoutData || []);

      // Build flattened ticket instances based on cart
      const instances: any[] = [];
      Object.keys(cart).forEach((tierId) => {
        const qty = cart[tierId];
        const tierObj = tiers.find((t) => t.id === tierId);
        for (let i = 0; i < qty; i++) {
          instances.push({
            id: crypto.randomUUID(), // Unique ID for form tracking
            tier: tierObj,
            answers: {},
          });
        }
      });
      setTicketForms(instances);
      setLoading(false);
    }
    init();
  }, [eventId, cart, tiers]);

  const handleAnswerChange = (ticketId: string, fieldId: string, value: string) => {
    setTicketForms((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return { ...t, answers: { ...t.answers, [fieldId]: value } };
        }
        return t;
      })
    );
  };

  const subtotalCents = ticketForms.reduce((acc, t) => acc + (t.tier.pricing?.amount || 0), 0);

  const executePurchase = async ({
    finalTotalCents,
    onSuccess,
    onError,
    onBeforeComplete,
  }: {
    finalTotalCents: number;
    onSuccess: () => void;
    onError: (err: any) => void;
    onBeforeComplete?: () => Promise<void>;
  }) => {
    const result = await supabase.auth.getUser();
    const user = result?.data?.user || null;

    // Determine the buyer's email and owner_id based on login status
    const buyerEmail = user?.email || guestEmail;
    const ownerId = user?.id || null; // Null for guest users

    if (!user && !buyerEmail) {
      onError(new Error('Authentication or guest email is required.'));
      return;
    }

    try {
      const orderId = crypto.randomUUID();
      const discountCents = subtotalCents - finalTotalCents;

      // Map cart to items for the order
      const orderItems = Object.keys(cart).map((tierId) => {
        const tier = tiers.find((t) => t.id === tierId);
        return {
          ticket_type_id: tierId,
          quantity: cart[tierId],
          price_cents: tier?.pricing?.amount || 0,
        };
      });

      const orderData = {
        id: orderId,
        event_id: eventId,
        items: orderItems,
        buyer_email: buyerEmail,
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        total_cents: finalTotalCents,
        status: 'completed',
      };

      // Insert individual tickets with their personalizations
      const ticketsToInsert = ticketForms.map((t) => {
        // Build final personalization JSON
        const personalization: any = {};
        checkoutFields.forEach((f) => {
          personalization[f.label] = t.answers[f.id] || '';
        });
        // Always include user email as a fallback if not asked
        if (!personalization['Email']) personalization['Email'] = buyerEmail;

        // Generate a unique ticket code
        const ticketCode = crypto.randomUUID();

        // Distribute price paid proportionally
        const priceRatio = subtotalCents > 0 ? (t.tier.pricing?.amount || 0) / subtotalCents : 0;
        const ticketPricePaid = Math.round(finalTotalCents * priceRatio);

        return {
          id: crypto.randomUUID(),
          event_id: eventId,
          ticket_type_id: t.tier.id,
          order_id: orderId,
          personalization: personalization,
          buyer_email: buyerEmail,
          status: 'valid',
          price_paid_cents: ticketPricePaid,
          owner_id: ownerId, // Null for guest users
          ticket_code: ticketCode, // Include the new ticket code
        };
      });

      const { error: rpcError } = await supabase.rpc('create_checkout_transaction', {
        p_order: orderData,
        p_tickets: ticketsToInsert,
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
    // If NOT logged in (guest checkout), ensure guestEmail is provided
    if (!user && !guestEmail) {
      showToast('Please enter your email for guest checkout.', 'error');
      return false;
    }

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
    executePurchase,
  };
}
