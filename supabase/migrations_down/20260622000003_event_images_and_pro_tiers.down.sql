DROP POLICY IF EXISTS "Public Image Access" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can upload images" ON storage.objects;
DELETE FROM storage.buckets WHERE id = 'event_images';
ALTER TABLE public.events 
  DROP COLUMN IF EXISTS images,
  DROP COLUMN IF EXISTS theme_customization;
ALTER TABLE public.organizer_profiles DROP COLUMN IF EXISTS subscription_tier;
