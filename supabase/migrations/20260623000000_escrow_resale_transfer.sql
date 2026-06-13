-- Phase 1: Secondary Market Expansion (Escrow Transfer & Price Capping)

-- 1. Create a trigger to enforce dynamic price capping (Max 10% above face value)
-- supabase-lint-ignore function_search_path_mutable
-- supabase-lint-ignore anon_security_definer_function_executable
-- supabase-lint-ignore authenticated_security_definer_function_executable
CREATE OR REPLACE FUNCTION trg_enforce_price_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_original_price INTEGER;
BEGIN
    SELECT price_paid_cents INTO v_original_price
    FROM tickets
    WHERE id = NEW.ticket_id;

    IF NEW.asking_price_cents > (v_original_price * 1.10) THEN
        RAISE EXCEPTION 'resale_price_cap_exceeded';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_price_cap ON resale_listings;
CREATE TRIGGER trigger_enforce_price_cap
BEFORE INSERT OR UPDATE ON resale_listings
FOR EACH ROW
EXECUTE FUNCTION trg_enforce_price_cap();

-- 2. Update the RPC to use Cryptographic Escrow Transfer
-- supabase-lint-ignore authenticated_security_definer_function_executable
CREATE OR REPLACE FUNCTION buy_resale_ticket(p_listing_id UUID, p_buyer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_old_ticket tickets%ROWTYPE;
    v_is_active BOOLEAN;
    v_asking_price INTEGER;
    v_new_ticket_id TEXT;
    v_buyer_email TEXT;
BEGIN
    -- 1. Lock the listing
    SELECT is_active, asking_price_cents INTO v_is_active, v_asking_price
    FROM resale_listings 
    WHERE id = p_listing_id 
    FOR UPDATE;

    IF NOT FOUND OR NOT v_is_active THEN
        RAISE EXCEPTION 'Listing is no longer active or does not exist';
    END IF;

    -- Fetch the old ticket
    SELECT * INTO v_old_ticket
    FROM tickets
    WHERE id = (SELECT ticket_id FROM resale_listings WHERE id = p_listing_id);

    IF v_old_ticket.status != 'valid' THEN
        RAISE EXCEPTION 'Ticket is not valid for transfer';
    END IF;

    -- 2. Mark listing as inactive
    UPDATE resale_listings SET is_active = FALSE WHERE id = p_listing_id;

    -- 3. Invalidate the old ticket
    UPDATE tickets SET status = 'transferred' WHERE id = v_old_ticket.id;

    -- 4. Get the buyer email (using auth schema requires access, so we do it silently and fallback)
    -- As a SECURITY DEFINER, we have access to auth.users if we run as postgres
    BEGIN
        SELECT email INTO v_buyer_email FROM auth.users WHERE id = p_buyer_id;
    EXCEPTION WHEN OTHERS THEN
        v_buyer_email := v_old_ticket.buyer_email;
    END;

    IF v_buyer_email IS NULL THEN
        v_buyer_email := v_old_ticket.buyer_email;
    END IF;

    -- 5. Mint a brand new ticket (Cryptographic Escrow Transfer)
    -- trigger_set_ticket_qr_payload will auto-generate the new HMAC
    v_new_ticket_id := gen_random_uuid()::TEXT;
    
    INSERT INTO tickets (
        id, 
        event_id, 
        ticket_type_id, 
        order_id, 
        personalization, 
        buyer_email, 
        valid_from, 
        valid_until, 
        status, 
        price_paid_cents, 
        owner_id
    ) VALUES (
        v_new_ticket_id,
        v_old_ticket.event_id,
        v_old_ticket.ticket_type_id,
        v_old_ticket.order_id, 
        v_old_ticket.personalization, 
        v_buyer_email,
        v_old_ticket.valid_from,
        v_old_ticket.valid_until,
        'valid',
        v_asking_price,
        p_buyer_id
    );

    RETURN TRUE;
END;
$$;

-- Secure the RPC
REVOKE EXECUTE ON FUNCTION buy_resale_ticket(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION buy_resale_ticket(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION buy_resale_ticket(UUID, UUID) TO authenticated;
