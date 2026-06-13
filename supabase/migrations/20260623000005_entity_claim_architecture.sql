-- 1. Decouple organizer_profiles from auth.users and rename to organizers
ALTER TABLE public.organizer_profiles DROP CONSTRAINT IF EXISTS organizer_profiles_id_fkey;
ALTER TABLE public.organizer_profiles RENAME TO organizers;

ALTER TABLE public.organizers RENAME COLUMN company_name TO name;
ALTER TABLE public.organizers RENAME COLUMN verified TO is_verified;
ALTER TABLE public.organizers ADD COLUMN bio TEXT;
ALTER TABLE public.organizers ADD COLUMN image_url TEXT;
ALTER TABLE public.organizers ADD COLUMN claimed_by_user_id UUID REFERENCES auth.users(id);

-- Existing organizers were tied 1:1 to auth.users, so their claimed_by_user_id is their id.
UPDATE public.organizers SET claimed_by_user_id = id;

ALTER TABLE public.organizers ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Update RLS for organizers
DROP POLICY IF EXISTS "Organizers manage own profile" ON public.organizers;
CREATE POLICY "Organizers manage own profile" ON public.organizers 
FOR ALL USING (claimed_by_user_id = auth.uid());

CREATE POLICY "Public read organizers" ON public.organizers 
FOR SELECT USING (true);


-- 2. Create venues table
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT,
    country TEXT,
    capacity INTEGER,
    bio TEXT,
    image_url TEXT,
    claimed_by_user_id UUID REFERENCES auth.users(id),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read venues" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Venues manage own profile" ON public.venues FOR ALL USING (claimed_by_user_id = auth.uid());


-- 3. Modify events table to use venues
ALTER TABLE public.events ADD COLUMN venue_id UUID REFERENCES public.venues(id);

-- Seed venues from existing text columns
INSERT INTO public.venues (name, city, country)
SELECT DISTINCT COALESCE(venue, 'Unknown Venue'), city, country
FROM public.events
WHERE venue IS NOT NULL AND venue != '';

-- Link events to the newly seeded venues
UPDATE public.events e
SET venue_id = v.id
FROM public.venues v
WHERE COALESCE(e.venue, 'Unknown Venue') = v.name 
  AND (e.city = v.city OR (e.city IS NULL AND v.city IS NULL));

-- We will NOT drop the old text columns just yet to avoid catastrophic frontend breakages mid-migration, 
-- but all new reads/writes should use venue_id.


-- 4. Unified Entity Claims
ALTER TABLE public.artist_claims RENAME TO entity_claims;
ALTER TABLE public.entity_claims RENAME COLUMN artist_id TO entity_id;

-- entity_type can be 'artist', 'venue', 'organizer'
ALTER TABLE public.entity_claims ADD COLUMN entity_type TEXT NOT NULL DEFAULT 'artist' CHECK (entity_type IN ('artist', 'venue', 'organizer'));

-- We cannot strictly enforce foreign keys on entity_id since it could point to 3 different tables,
-- so we rely on application logic to ensure validity.
ALTER TABLE public.entity_claims DROP CONSTRAINT IF EXISTS artist_claims_artist_id_fkey;

-- Since we changed RLS on organizers, we need to fix the Events RLS so organizers can manage events.
-- Previously: auth.uid() = organizer_id
-- Now: events.organizer_id is managed by auth.uid()
DROP POLICY IF EXISTS "Organizers manage own events" ON public.events;
CREATE POLICY "Organizers manage own events" ON public.events 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.organizers 
        WHERE organizers.id = events.organizer_id 
        AND organizers.claimed_by_user_id = auth.uid()
    )
);
