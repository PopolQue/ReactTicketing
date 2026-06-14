ALTER TABLE public.events ADD COLUMN category TEXT DEFAULT 'other' CHECK (category IN ('clubnight', 'concert', 'festival', 'workshop', 'other'));
