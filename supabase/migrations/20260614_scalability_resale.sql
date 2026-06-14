-- 1. Add sold_count to ticket_types
ALTER TABLE public.ticket_types ADD COLUMN IF NOT EXISTS sold_count INTEGER NOT NULL DEFAULT 0;

-- 2. Create trigger to maintain sold_count
CREATE OR REPLACE FUNCTION public.update_ticket_type_sold_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.ticket_types
        SET sold_count = sold_count + 1
        WHERE id = NEW.ticket_type_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.ticket_types
        SET sold_count = sold_count - 1
        WHERE id = OLD.ticket_type_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ticket_type_sold_count ON public.tickets;
CREATE TRIGGER trg_update_ticket_type_sold_count
AFTER INSERT OR DELETE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_ticket_type_sold_count();

-- Recalculate existing sold_count just in case
UPDATE public.ticket_types tt
SET sold_count = (
    SELECT COUNT(*) FROM public.tickets t WHERE t.ticket_type_id = tt.id
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type_id ON public.tickets(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_ticket_id ON public.scan_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_scan_accounts_event_id ON public.scan_accounts(event_id);

-- 4. Upgrades for Phase-Shift Resale Strategy
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS open_market_threshold_hours INTEGER NOT NULL DEFAULT 168; -- 7 days

-- Extend resale_listings for waitlist phase logic
-- We need status: 'listed', 'offered', 'open_market', 'sold', 'expired'
-- We might need a type change, let's just add the columns and drop is_active logic if needed, 
-- or map is_active = true to mean it's open. For simplicity, add new columns:
ALTER TABLE public.resale_listings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'listed' CHECK (status IN ('listed', 'offered', 'open_market', 'sold', 'expired'));
ALTER TABLE public.resale_listings ADD COLUMN IF NOT EXISTS offered_to_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.resale_listings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill status for existing active listings
UPDATE public.resale_listings SET status = 'open_market' WHERE is_active = true AND status = 'listed';
UPDATE public.resale_listings SET status = 'sold' WHERE is_active = false AND status = 'listed';
