DROP POLICY IF EXISTS "Public read organizers" ON public.organizers;
DROP POLICY IF EXISTS "Organizers manage own profile" ON public.organizers;
DROP POLICY IF EXISTS "Organizers manage own events" ON public.events;

ALTER TABLE public.organizers RENAME TO organizer_profiles;
ALTER TABLE public.organizer_profiles DROP CONSTRAINT IF EXISTS organizers_claimed_by_user_id_fkey;
ALTER TABLE public.organizer_profiles RENAME COLUMN name TO company_name;
ALTER TABLE public.organizer_profiles RENAME COLUMN is_verified TO verified;
ALTER TABLE public.organizer_profiles DROP COLUMN IF EXISTS bio;
ALTER TABLE public.organizer_profiles DROP COLUMN IF EXISTS image_url;
ALTER TABLE public.organizer_profiles DROP COLUMN IF EXISTS claimed_by_user_id;
ALTER TABLE public.organizer_profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.organizer_profiles ADD CONSTRAINT organizer_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);

CREATE POLICY "Organizers manage own profile" ON public.organizer_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Organizers manage own events" ON public.events FOR ALL USING (auth.uid() = organizer_id);

ALTER TABLE public.events DROP COLUMN IF EXISTS venue_id;
DROP TABLE IF EXISTS public.venues CASCADE;

ALTER TABLE public.entity_claims RENAME TO artist_claims;
ALTER TABLE public.artist_claims RENAME COLUMN entity_id TO artist_id;
ALTER TABLE public.artist_claims DROP COLUMN IF EXISTS entity_type;
ALTER TABLE public.artist_claims ADD CONSTRAINT artist_claims_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id) ON DELETE CASCADE;
