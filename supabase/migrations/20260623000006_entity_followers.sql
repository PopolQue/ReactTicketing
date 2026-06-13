CREATE TABLE IF NOT EXISTS public.entity_followers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('artist', 'venue', 'organizer')),
  entity_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Prevent duplicate follows
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_follow ON public.entity_followers(user_id, entity_type, entity_id);

-- Speed up follower counts
CREATE INDEX IF NOT EXISTS idx_entity_followers_count ON public.entity_followers(entity_type, entity_id);

-- Security Policies
ALTER TABLE public.entity_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read follows" 
  ON public.entity_followers FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own follows" 
  ON public.entity_followers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follows" 
  ON public.entity_followers FOR DELETE 
  USING (auth.uid() = user_id);
