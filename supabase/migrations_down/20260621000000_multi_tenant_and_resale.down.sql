DROP TABLE IF EXISTS public.resale_listings CASCADE;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS owner_id;
ALTER TABLE public.events DROP COLUMN IF EXISTS organizer_id;
DROP TABLE IF EXISTS public.organizer_profiles CASCADE;
