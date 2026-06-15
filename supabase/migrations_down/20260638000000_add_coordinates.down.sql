ALTER TABLE public.events DROP COLUMN IF EXISTS latitude;
ALTER TABLE public.events DROP COLUMN IF EXISTS longitude;

ALTER TABLE public.venues DROP COLUMN IF EXISTS latitude;
ALTER TABLE public.venues DROP COLUMN IF EXISTS longitude;
