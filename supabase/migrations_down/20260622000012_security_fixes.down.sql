ALTER TABLE public.timezones DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Timezones are viewable by everyone" ON public.timezones;

ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;

ALTER TABLE public.scan_events DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizers can view scan events" ON public.scan_events;
DROP POLICY IF EXISTS "Users can create scan events" ON public.scan_events;

ALTER TABLE public.scan_accounts DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizers manage scan accounts" ON public.scan_accounts;

DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;
CREATE POLICY "Anyone can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
);

CREATE POLICY "Public Image Access" ON storage.objects FOR SELECT USING (bucket_id = 'event_images');

CREATE OR REPLACE FUNCTION public.buy_resale_ticket(p_listing_id UUID, p_buyer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket_id TEXT;
    v_seller_id UUID;
    v_is_active BOOLEAN;
BEGIN
    SELECT ticket_id, seller_id, is_active 
    INTO v_ticket_id, v_seller_id, v_is_active
    FROM resale_listings 
    WHERE id = p_listing_id 
    FOR UPDATE;

    IF NOT FOUND OR NOT v_is_active THEN
        RAISE EXCEPTION 'Listing is no longer active or does not exist';
    END IF;

    UPDATE resale_listings SET is_active = FALSE WHERE id = p_listing_id;
    UPDATE tickets SET owner_id = p_buyer_id WHERE id = v_ticket_id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_resale_ticket(UUID, UUID) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_admin_by_email(TEXT) TO PUBLIC, anon;
