-- 1. Add sold_count to ticket_types
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS sold_count INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill sold_count
UPDATE ticket_types tt
SET sold_count = (
  SELECT COUNT(*)
  FROM tickets t
  WHERE t.ticket_type_id = tt.id AND t.status != 'cancelled'
);

-- 3. Trigger to maintain sold_count
CREATE OR REPLACE FUNCTION public.update_ticket_type_sold_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status != 'cancelled' THEN
      UPDATE public.ticket_types SET sold_count = sold_count + 1 WHERE id = NEW.ticket_type_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status changed to something other than cancelled
    IF NEW.status != 'cancelled' AND OLD.status = 'cancelled' THEN
      UPDATE public.ticket_types SET sold_count = sold_count + 1 WHERE id = NEW.ticket_type_id;
    -- If status changed to cancelled
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      UPDATE public.ticket_types SET sold_count = sold_count - 1 WHERE id = NEW.ticket_type_id;
    -- If ticket type changed (rare but possible)
    ELSIF NEW.ticket_type_id != OLD.ticket_type_id THEN
      IF NEW.status != 'cancelled' THEN
        UPDATE public.ticket_types SET sold_count = sold_count + 1 WHERE id = NEW.ticket_type_id;
      END IF;
      IF OLD.status != 'cancelled' THEN
        UPDATE public.ticket_types SET sold_count = sold_count - 1 WHERE id = OLD.ticket_type_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status != 'cancelled' THEN
      UPDATE public.ticket_types SET sold_count = sold_count - 1 WHERE id = OLD.ticket_type_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.update_ticket_type_sold_count() FROM PUBLIC;

DROP TRIGGER IF EXISTS maintain_ticket_type_sold_count ON public.tickets;
CREATE TRIGGER maintain_ticket_type_sold_count
AFTER INSERT OR UPDATE OR DELETE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.update_ticket_type_sold_count();

-- 4. Create missing indexes
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type_id ON public.tickets(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_ticket_id ON public.scan_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_scan_accounts_event_id ON public.scan_accounts(event_id);
