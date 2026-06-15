-- Track organizer PayPal connection status
ALTER TABLE organizers 
ADD COLUMN paypal_merchant_id TEXT,
ADD COLUMN paypal_onboarded BOOLEAN DEFAULT FALSE;

-- Ensure orders track PayPal details
ALTER TABLE orders 
ADD COLUMN paypal_order_id TEXT UNIQUE,
ADD COLUMN paypal_capture_id TEXT UNIQUE,
ADD COLUMN payment_provider TEXT DEFAULT 'stripe'; -- 'stripe' | 'paypal'

-- Idempotent ticket issuance RPC
CREATE OR REPLACE FUNCTION issue_tickets_if_not_issued(
    p_paypal_order_id TEXT,
    p_capture_id TEXT
) RETURNS VOID AS $$
DECLARE
    v_order_id UUID;
BEGIN
    -- 1. Check if already captured
    IF EXISTS (SELECT 1 FROM orders WHERE paypal_capture_id = p_capture_id) THEN
        RETURN;
    END IF;

    -- 2. Update order status
    UPDATE orders 
    SET status = 'paid', paypal_capture_id = p_capture_id
    WHERE paypal_order_id = p_paypal_order_id
    RETURNING id INTO v_order_id;

    -- 3. You would trigger ticket issuance logic here or handle via application code
END;
$$ LANGUAGE plpgsql;
