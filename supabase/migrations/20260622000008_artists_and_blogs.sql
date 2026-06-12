-- Migration for Artist Profiles and Blog Features

-- 1. Artists Table
CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  spotify_url TEXT,
  instagram_url TEXT,
  soundcloud_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.organizer_profiles(id)
);

-- RLS for Artists
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
-- Public can view all artists
CREATE POLICY "Public can view artists" ON public.artists
  FOR SELECT USING (TRUE);
-- Organizers can create/edit artists they created
CREATE POLICY "Organizers manage their artists" ON public.artists
  FOR ALL USING (auth.uid() = created_by);

-- 2. Event Artists (Junction Table)
CREATE TABLE public.event_artists (
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
  performance_time TIMESTAMPTZ,
  stage_name TEXT,
  PRIMARY KEY (event_id, artist_id)
);

-- RLS for Event Artists
ALTER TABLE public.event_artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view event artists" ON public.event_artists
  FOR SELECT USING (TRUE);
-- Let organizers manage artists for their events by joining on events table
CREATE POLICY "Organizers manage event artists" ON public.event_artists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_artists.event_id AND organizer_id = auth.uid()
    )
  );


-- 3. Blogs / Articles Table
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  published BOOLEAN DEFAULT FALSE,
  author_id UUID REFERENCES public.organizer_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Blogs
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
-- Public can view published blogs
CREATE POLICY "Public can view published blogs" ON public.blogs
  FOR SELECT USING (published = TRUE);
-- Authors (organizers) can manage their own blogs
CREATE POLICY "Organizers manage their blogs" ON public.blogs
  FOR ALL USING (auth.uid() = author_id);
