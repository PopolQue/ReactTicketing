-- Fix RLS on timezones
ALTER TABLE public.timezones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Timezones are viewable by everyone" ON public.timezones FOR SELECT USING (true);

-- Fix RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (buyer_email = auth.jwt()->>'email');
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (buyer_email = auth.jwt()->>'email');

-- Fix RLS on scan_events
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers can view scan events" ON public.scan_events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tickets t 
        JOIN events e ON t.event_id = e.id 
        WHERE scan_events.ticket_id = t.id AND e.organizer_id = auth.uid()
    ) OR scanned_by_account_id = auth.uid()::text
);
CREATE POLICY "Users can create scan events" ON public.scan_events FOR INSERT WITH CHECK (scanned_by_account_id = auth.uid()::text);

-- Fix RLS on scan_accounts
ALTER TABLE public.scan_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers manage scan accounts" ON public.scan_accounts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM events WHERE id = scan_accounts.event_id AND organizer_id = auth.uid()
    )
);

-- Fix support_tickets INSERT policy (prevent impersonation)
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;
CREATE POLICY "Anyone can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
);

-- Fix storage bucket public listing
DROP POLICY IF EXISTS "Public Image Access" ON storage.objects;

-- Fix buy_resale_ticket RPC security issues
CREATE OR REPLACE FUNCTION public.buy_resale_ticket(p_listing_id UUID, p_buyer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Revoke anon execute to fix the "Public Can Execute" and "Signed-In Users Can Execute" warning properly
-- Only authenticated users should execute this.
REVOKE EXECUTE ON FUNCTION public.buy_resale_ticket(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.buy_resale_ticket(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.buy_resale_ticket(UUID, UUID) TO authenticated;

-- Revoke anon execute from promote_admin_by_email
REVOKE EXECUTE ON FUNCTION public.promote_admin_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.promote_admin_by_email(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.promote_admin_by_email(TEXT) TO authenticated;
