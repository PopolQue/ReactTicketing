ALTER TABLE public.events
ADD COLUMN is_external BOOLEAN DEFAULT FALSE,
ADD COLUMN external_ticket_url TEXT;
