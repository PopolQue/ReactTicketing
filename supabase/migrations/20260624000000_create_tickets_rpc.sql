CREATE OR REPLACE FUNCTION create_tickets_transaction(
    p_tickets JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket JSONB;
BEGIN
    FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_tickets)
    LOOP
        INSERT INTO tickets (
            id, event_id, ticket_type_id, order_id, personalization,
            buyer_email, issued_at, valid_from, valid_until, status, price_paid_cents
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
            (v_ticket->>'pricePaidCents')::int
        );
    END LOOP;
END;
$$;
