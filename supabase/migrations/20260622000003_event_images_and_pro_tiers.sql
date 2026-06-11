-- 1. Add subscription tier to organizer profiles
ALTER TABLE organizer_profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- 2. Add images and theme customization to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS theme_customization JSONB DEFAULT '{}'::jsonb;

-- 3. Create a public storage bucket for event images (Requires superuser privileges, which migrations have)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event_images', 'event_images', true) 
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS on storage objects for this bucket
CREATE POLICY "Public Image Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'event_images');

CREATE POLICY "Organizers can upload images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'event_images' AND auth.role() = 'authenticated');
