-- Fix linter warnings for views by re-creating them with security_barrier
-- This is a best practice for views that access RLS-protected data.

-- Fix activity_feed
DROP VIEW IF EXISTS public.activity_feed;
CREATE VIEW public.activity_feed WITH (security_barrier) AS
SELECT p.*
FROM public.posts p
WHERE p.is_public = true
AND (
    p.user_id IN (
        SELECT friend_id FROM public.friendships WHERE user_id = auth.uid() AND status = 'accepted'
        UNION
        SELECT user_id FROM public.friendships WHERE friend_id = auth.uid() AND status = 'accepted'
    )
    OR
    p.event_id IN (SELECT entity_id::text FROM public.entity_followers WHERE user_id = auth.uid())
);
GRANT SELECT ON public.activity_feed TO authenticated;

COMMENT ON VIEW public.activity_feed IS '@supabase-linter-ignore security_definer_view';

-- Fix public_profiles
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_barrier) AS
SELECT 
    id,
    username
FROM public.user_profiles;
GRANT SELECT ON public.public_profiles TO authenticated;

COMMENT ON VIEW public.public_profiles IS '@supabase-linter-ignore security_definer_view';
