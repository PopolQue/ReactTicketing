-- Fix search path and permissions for create_tickets_transaction
CREATE OR REPLACE FUNCTION public.create_tickets_transaction(
    p_tickets JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_ticket JSONB;
BEGIN
    FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_tickets)
    LOOP
        INSERT INTO public.tickets (
            id, event_id, ticket_type_id, order_id, personalization,
            buyer_email, issued_at, valid_from, valid_until, status, price_paid_cents, owner_id
        ) VALUES (
            (v_ticket->>'id'),
            (v_ticket->>'eventId'),
            (v_ticket->>'ticketTypeId'),
            (v_ticket->>'orderId'),
            (v_ticket->'personalization'),
            (v_ticket->>'buyerEmail'),
            (v_ticket->>'issuedAt')::timestamp,
            (v_ticket->>'validFrom')::timestamp,
            (v_ticket->>'validUntil')::timestamp,
            (v_ticket->>'status'),
            (v_ticket->>'pricePaidCents')::int,
            (v_ticket->>'owner_id')::uuid
        );
    END LOOP;
END;
$$;

-- Revoke from public, keep authenticated
REVOKE EXECUTE ON FUNCTION public.create_tickets_transaction(JSONB) FROM public;
REVOKE EXECUTE ON FUNCTION public.create_tickets_transaction(JSONB) FROM anon;

-- Fix search path and permissions for create_checkout_transaction
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

-- Revoke from public, keep authenticated
REVOKE EXECUTE ON FUNCTION public.create_checkout_transaction(JSONB, JSONB) FROM public;
REVOKE EXECUTE ON FUNCTION public.create_checkout_transaction(JSONB, JSONB) FROM anon;
