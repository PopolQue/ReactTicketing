-- Prevent complimentary tickets from being resold
CREATE OR REPLACE FUNCTION check_ticket_resellable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_price_paid INT;
BEGIN
    SELECT price_paid_cents INTO v_price_paid FROM public.tickets WHERE id = NEW.ticket_id;
    
    IF v_price_paid <= 0 THEN
        RAISE EXCEPTION 'Complimentary tickets cannot be listed for resale.';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_ticket_resellable ON public.resale_listings;

CREATE TRIGGER ensure_ticket_resellable
BEFORE INSERT ON public.resale_listings
FOR EACH ROW
EXECUTE FUNCTION check_ticket_resellable();
