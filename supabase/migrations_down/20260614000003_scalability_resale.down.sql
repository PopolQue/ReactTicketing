DROP TRIGGER IF EXISTS trg_update_ticket_type_sold_count ON public.tickets;
DROP FUNCTION IF EXISTS public.update_ticket_type_sold_count() CASCADE;
ALTER TABLE public.ticket_types DROP COLUMN IF EXISTS sold_count;

DROP INDEX IF EXISTS public.idx_tickets_ticket_type_id;
DROP INDEX IF EXISTS public.idx_scan_events_ticket_id;
DROP INDEX IF EXISTS public.idx_scan_accounts_event_id;

ALTER TABLE public.events DROP COLUMN IF EXISTS open_market_threshold_hours;

ALTER TABLE public.resale_listings DROP COLUMN IF EXISTS status;
ALTER TABLE public.resale_listings DROP COLUMN IF EXISTS offered_to_user_id;
ALTER TABLE public.resale_listings DROP COLUMN IF EXISTS expires_at;
