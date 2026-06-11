-- Create a secure RPC function to handle the atomic transfer of a resale ticket
-- This runs as SECURITY DEFINER to bypass RLS, ensuring that only the strict logic inside can transfer ownership.

CREATE OR REPLACE FUNCTION buy_resale_ticket(p_listing_id UUID, p_buyer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket_id TEXT;
    v_seller_id UUID;
    v_is_active BOOLEAN;
BEGIN
    -- 1. Get listing info and lock the row to prevent double-spending race conditions
    SELECT ticket_id, seller_id, is_active 
    INTO v_ticket_id, v_seller_id, v_is_active
    FROM resale_listings 
    WHERE id = p_listing_id 
    FOR UPDATE;

    IF NOT FOUND OR NOT v_is_active THEN
        RAISE EXCEPTION 'Listing is no longer active or does not exist';
    END IF;

    -- 2. Mark listing as inactive (completed)
    UPDATE resale_listings SET is_active = FALSE WHERE id = p_listing_id;

    -- 3. Transfer ticket ownership to the new buyer
    UPDATE tickets SET owner_id = p_buyer_id WHERE id = v_ticket_id;

    RETURN TRUE;
END;
$$;
