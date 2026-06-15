-- Add coordinates to venues and events tables
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
