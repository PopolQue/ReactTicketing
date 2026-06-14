CREATE OR REPLACE FUNCTION create_checkout_transaction(
    p_order JSONB,
    p_tickets JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket JSONB;
BEGIN
    INSERT INTO orders (
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
