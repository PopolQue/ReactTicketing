ALTER TABLE public.tickets DROP COLUMN IF EXISTS transfer_history;
ALTER TABLE public.tickets ALTER COLUMN status SET DEFAULT 'valid';
ALTER TABLE public.tickets ALTER COLUMN qr_payload SET NOT NULL;
