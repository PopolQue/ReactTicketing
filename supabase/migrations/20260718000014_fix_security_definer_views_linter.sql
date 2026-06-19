-- Fix activity_feed to run as invoker
DROP VIEW IF EXISTS public.activity_feed;
CREATE VIEW public.activity_feed WITH (security_barrier = true, security_invoker = true) AS
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

-- Fix public_profiles to run as invoker
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_barrier = true, security_invoker = true) AS
SELECT 
    id,
    username
FROM public.user_profiles;
GRANT SELECT ON public.public_profiles TO authenticated;
