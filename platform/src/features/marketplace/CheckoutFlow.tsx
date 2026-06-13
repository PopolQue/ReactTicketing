import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import CheckoutModal from '../../components/CheckoutModal';

export default function CheckoutFlow({
  event,
  tiers,
  cart,
  onCancel,
  onComplete
}: {
  event: any;
  tiers: any[];
  cart: { [tierId: string]: number };
  onCancel: () => void;
  onComplete: () => void;
}) {
  const { showToast } = useToast();
  const [checkoutFields, setCheckoutFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // flattened list of tickets in the cart
  const [ticketForms, setTicketForms] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // 0 = Forms, 1 = Review & Pay

  useEffect(() => {
    async function fetchFields() {
      const { data } = await supabase
        .from('event_checkout_fields')
        .select('*')
        .eq('event_id', event.id)
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
  }, [event.id, cart, tiers]);

  const handleAnswerChange = (ticketId: string, fieldId: string, value: string) => {
    setTicketForms(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, answers: { ...t.answers, [fieldId]: value } };
      }
      return t;
    }));
  };

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = async () => {
    setPromoError('');
    if (!promoCode) return;
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('event_id', event.id)
      .eq('code', promoCode.toUpperCase())
      .eq('active', true)
      .single();
    
    if (error || !data) {
      setPromoError('Invalid or expired promo code');
    } else {
      setAppliedPromo(data);
    }
  };

  const subtotalCents = ticketForms.reduce((acc, t) => acc + (t.tier.pricing?.amount || 0), 0);
  
  const getDiscountedAmount = () => {
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

  const finalTotalCents = getDiscountedAmount();

  const handleProceedToPay = () => {
    // Validate forms
    for (const t of ticketForms) {
      for (const f of checkoutFields) {
        if (f.is_required && !t.answers[f.id]) {
          showToast(`Please fill out ${f.label} for all tickets.`, 'error');
          return;
        }
      }
    }
    setCurrentStep(1);
  };

  const executePurchase = async (paymentMethodObj?: any) => {
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

      const { error: orderError } = await supabase.from('orders').insert([{
        id: orderId,
        event_id: event.id,
        items: orderItems,
        buyer_email: user.email,
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        total_cents: finalTotalCents,
        status: 'completed'
      }]);

      if (orderError) throw orderError;

      // Insert individual tickets with their personalizations
      const ticketsToInsert = ticketForms.map(t => {
        // Build final personalization JSON
        const personalization: any = {};
        checkoutFields.forEach(f => {
          personalization[f.label] = t.answers[f.id] || '';
        });
        // Always include user email as a fallback if not asked
        if (!personalization['Email']) personalization['Email'] = user.email;

        // Distribute price paid proportionally or just divide finalTotalCents
        const priceRatio = subtotalCents > 0 ? (t.tier.pricing?.amount || 0) / subtotalCents : 0;
        const ticketPricePaid = Math.round(finalTotalCents * priceRatio);

        return {
          id: crypto.randomUUID(),
          event_id: event.id,
          ticket_type_id: t.tier.id,
          order_id: orderId,
          personalization: personalization,
          buyer_email: user.email,
          status: 'valid',
          price_paid_cents: ticketPricePaid,
          owner_id: user.id
        };
      });

      const { error: ticketError } = await supabase.from('tickets').insert(ticketsToInsert);
      if (ticketError) throw ticketError;

      if (appliedPromo) {
          await supabase.rpc('increment_promo_usage', { p_code: appliedPromo.code, p_event_id: event.id });
      }

      showToast('Tickets purchased successfully! View them in your wallet.', 'success');
      onComplete();
    } catch (err: any) {
      showToast("Error purchasing tickets: " + err.message, 'error');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Preparing your checkout...</div>;

  if (currentStep === 1) {
    if (finalTotalCents === 0) {
      return (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Free Order</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Your total is €0.00. No payment information is required.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setCurrentStep(0)} className="btn-secondary">Go Back</button>
            <button onClick={() => executePurchase()} className="btn-primary" style={{ backgroundColor: '#10b981' }}>Complete Order</button>
          </div>
        </div>
      );
    }
    return (
      <CheckoutModal
        eventId={event.id}
        amountCents={finalTotalCents}
        itemName={`${ticketForms.length}x Tickets`}
        onConfirm={executePurchase}
        onCancel={() => setCurrentStep(0)}
      />
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h2 style={{ marginBottom: '24px' }}>Checkout</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        <div>
          <h3 style={{ marginBottom: '16px' }}>Ticket Details</h3>
          {ticketForms.map((t, index) => (
            <div key={t.id} style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: 'var(--accent)' }}>Ticket {index + 1}: {t.tier.name}</h4>
              
              {checkoutFields.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No additional information required.</p>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {checkoutFields.map(f => (
                    <div key={f.id}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {f.label} {f.is_required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <input 
                        type={f.field_type === 'EMAIL' ? 'email' : f.field_type === 'PHONE' ? 'tel' : f.field_type === 'AGE' ? 'number' : 'text'}
                        required={f.is_required}
                        className="input-field"
                        value={t.answers[f.id] || ''}
                        onChange={e => handleAnswerChange(t.id, f.id, e.target.value)}
                        placeholder={`Enter ${f.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Order Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {ticketForms.map((t, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>{t.tier.name}</span>
                  <span>€{((t.tier.pricing?.amount || 0) / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Promo Code</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  disabled={!!appliedPromo}
                  placeholder="CODE"
                />
                <button type="button" onClick={appliedPromo ? () => { setAppliedPromo(null); setPromoCode(''); } : handleApplyPromo} className="btn-secondary">
                  {appliedPromo ? 'Remove' : 'Apply'}
                </button>
              </div>
              {promoError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{promoError}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>€{(subtotalCents / 100).toFixed(2)}</span>
              </div>
              {appliedPromo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                  <span>Discount ({appliedPromo.code})</span>
                  <span>-€{((subtotalCents - finalTotalCents) / 100).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '1.2rem', fontWeight: 600 }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent)' }}>€{(finalTotalCents / 100).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleProceedToPay} className="btn-primary" style={{ flex: 2, backgroundColor: '#10b981' }}>
                {finalTotalCents === 0 ? 'Complete Order' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
