-- 1. Fix QR HMAC Secret
CREATE OR REPLACE FUNCTION public.generate_ticket_hmac(
  p_event_id TEXT,
  p_ticket_id TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret TEXT;
  v_payload TEXT;
  v_hmac BYTEA;
  v_hmac_base64 TEXT;
BEGIN
  BEGIN
    v_secret := current_setting('app.settings.qr_secret', true);
  EXCEPTION WHEN OTHERS THEN
    v_secret := NULL;
  END;

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'QR signing secret is not configured in postgres current_setting(app.settings.qr_secret)';
  END IF;

  v_payload := 'TF1.' || p_event_id || '.' || p_ticket_id;
  v_hmac := hmac(v_payload::bytea, v_secret::bytea, 'sha256');
  
  v_hmac_base64 := encode(v_hmac, 'base64');
  v_hmac_base64 := replace(replace(replace(v_hmac_base64, '+', '-'), '/', '_'), '=', '');

  RETURN v_payload || '.' || v_hmac_base64;
END;
$$;

-- 2. Fix Checkout Validation
CREATE OR REPLACE FUNCTION public.create_checkout_transaction(
    p_order JSONB,
    p_tickets JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ticket JSONB;
    v_item JSONB;
    v_calculated_subtotal INT := 0;
    v_calculated_discount INT := 0;
    v_tt_record RECORD;
    v_tt_price INT;
    v_promo RECORD;
    v_provided_total INT := (p_order->>'total_cents')::int;
    v_order_event_id TEXT := (p_order->>'event_id');
    v_buyer_email TEXT := (p_order->>'buyer_email');
    v_user_email TEXT;
BEGIN
    -- Authorization Check
    BEGIN
      v_user_email := auth.jwt()->>'email';
    EXCEPTION WHEN OTHERS THEN
      v_user_email := NULL;
    END;

    IF v_buyer_email != v_user_email THEN
      RAISE EXCEPTION 'Authorization error: buyer_email does not match authenticated user';
    END IF;

    -- Validate subtotal
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order->'items') LOOP
       SELECT * INTO v_tt_record FROM ticket_types WHERE id = (v_item->>'ticketTypeId') AND event_id = v_order_event_id;
       IF NOT FOUND THEN
         RAISE EXCEPTION 'Invalid ticket type %', v_item->>'ticketTypeId';
       END IF;
       
       IF v_tt_record.pricing->>'kind' = 'paid' THEN
         v_tt_price := (v_tt_record.pricing->>'priceInCents')::int;
       ELSE
         v_tt_price := 0;
       END IF;
       
       v_calculated_subtotal := v_calculated_subtotal + (v_tt_price * (v_item->>'quantity')::int);
    END LOOP;

    -- Validate discount
    IF (p_order->>'promo_code') IS NOT NULL AND (p_order->>'promo_code') != '' THEN
       SELECT * INTO v_promo FROM promo_codes WHERE code = (p_order->>'promo_code') AND event_id = v_order_event_id AND active = true;
       IF NOT FOUND THEN
         RAISE EXCEPTION 'Invalid promo code';
       END IF;
       
       IF v_promo.discount_kind = 'amount_off' THEN
         v_calculated_discount := v_promo.discount_value;
       ELSIF v_promo.discount_kind = 'percent_off' THEN
         v_calculated_discount := (v_calculated_subtotal * v_promo.discount_value / 100);
       ELSIF v_promo.discount_kind = 'free' THEN
         v_calculated_discount := v_calculated_subtotal;
       END IF;
    END IF;

    IF v_calculated_discount > v_calculated_subtotal THEN
       v_calculated_discount := v_calculated_subtotal;
    END IF;

    IF v_provided_total != (v_calculated_subtotal - v_calculated_discount) THEN
       RAISE EXCEPTION 'Price validation failed: provided total % does not match calculated total %', v_provided_total, (v_calculated_subtotal - v_calculated_discount);
    END IF;

    -- Insert Order
    INSERT INTO orders (
        id, event_id, buyer_email, items, subtotal_cents, discount_cents, total_cents, status
    ) VALUES (
        (p_order->>'id'),
        v_order_event_id,
        v_buyer_email,
        (p_order->'items'),
        v_calculated_subtotal,
        v_calculated_discount,
        v_provided_total,
        (p_order->>'status')
    );

    -- Insert Tickets
    FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_tickets)
    LOOP
        IF (v_ticket->>'owner_id') IS NOT NULL AND (v_ticket->>'owner_id')::uuid != auth.uid() THEN
            RAISE EXCEPTION 'Authorization error: ticket owner_id does not match authenticated user';
        END IF;

        INSERT INTO tickets (
            id, event_id, ticket_type_id, order_id, personalization,
            buyer_email, status, price_paid_cents, owner_id
        ) VALUES (
            (v_ticket->>'id'),
            (v_ticket->>'event_id'),
            (v_ticket->>'ticket_type_id'),
            (v_ticket->>'order_id'),
            (v_ticket->'personalization'),
            (v_ticket->>'buyer_email'),
            (v_ticket->>'status'),
            (v_ticket->>'price_paid_cents')::int,
            (v_ticket->>'owner_id')::uuid
        );
    END LOOP;
END;
$$;
