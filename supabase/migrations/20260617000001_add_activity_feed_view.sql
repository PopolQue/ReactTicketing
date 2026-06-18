-- Activity Feed View
CREATE OR REPLACE VIEW public.activity_feed AS
SELECT p.*
FROM public.posts p
WHERE p.is_public = true
AND (
    -- Friend posts (both ways)
    p.user_id IN (
        SELECT friend_id FROM public.friendships WHERE user_id = auth.uid() AND status = 'accepted'
        UNION
        SELECT user_id FROM public.friendships WHERE friend_id = auth.uid() AND status = 'accepted'
    )
    OR
    -- Posts about events followed by the user
    p.event_id IN (SELECT entity_id::text FROM public.entity_followers WHERE user_id = auth.uid())
);

GRANT SELECT ON public.activity_feed TO authenticated;
