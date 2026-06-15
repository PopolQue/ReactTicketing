DROP TABLE IF EXISTS public.artist_claims CASCADE;
DROP POLICY IF EXISTS "Organizers manage their unclaimed artists" ON public.artists;
DROP POLICY IF EXISTS "Artists manage their own profiles" ON public.artists;
ALTER TABLE public.artists DROP COLUMN IF EXISTS claimed_by_user_id;
ALTER TABLE public.artists DROP COLUMN IF EXISTS is_verified;

CREATE POLICY "Organizers manage their artists" ON public.artists
  FOR ALL USING (auth.uid() = created_by);
