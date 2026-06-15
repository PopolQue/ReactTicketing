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
  v_secret := 'dummy_secret_' || p_event_id;

  v_payload := 'TF1.' || p_event_id || '.' || p_ticket_id;
  v_hmac := hmac(v_payload::bytea, v_secret::bytea, 'sha256');
  
  v_hmac_base64 := encode(v_hmac, 'base64');
  v_hmac_base64 := replace(replace(replace(v_hmac_base64, '+', '-'), '/', '_'), '=', '');

  RETURN v_payload || '.' || v_hmac_base64;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_checkout_transaction(
    p_order JSONB,
    p_tickets JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_ticket JSONB;
BEGIN
    INSERT INTO public.orders (
        id, event_id, buyer_email, items, subtotal_cents, discount_cents, total_cents, status
    ) VALUES (
        (p_order->>'id'),
        (p_order->>'event_id'),
        (p_order->>'buyer_email'),
        (p_order->'items'),
        (p_order->>'subtotal_cents')::int,
        (p_order->>'discount_cents')::int,
        (p_order->>'total_cents')::int,
        (p_order->>'status')
    );

    FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_tickets)
    LOOP
        INSERT INTO public.tickets (
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
