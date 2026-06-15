DROP INDEX IF EXISTS public.idx_tickets_event_id_status;
DROP INDEX IF EXISTS public.idx_tickets_ticket_type_id_status;

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
