DROP TRIGGER IF EXISTS trigger_enforce_price_cap ON public.resale_listings;
DROP FUNCTION IF EXISTS public.trg_enforce_price_cap() CASCADE;

CREATE OR REPLACE FUNCTION public.buy_resale_ticket(p_listing_id UUID, p_buyer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    IF p_buyer_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot purchase ticket on behalf of another user';
    END IF;
    RETURN private.buy_resale_ticket(p_listing_id, p_buyer_id);
END;
$$;
