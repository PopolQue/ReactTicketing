ALTER TABLE public.events 
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS venue,
  DROP COLUMN IF EXISTS published;
