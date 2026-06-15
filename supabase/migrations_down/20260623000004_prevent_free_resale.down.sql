DROP TRIGGER IF EXISTS ensure_ticket_resellable ON public.resale_listings;
DROP FUNCTION IF EXISTS public.check_ticket_resellable() CASCADE;
