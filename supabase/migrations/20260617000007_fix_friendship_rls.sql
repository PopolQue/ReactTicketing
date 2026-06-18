-- Enable RLS (already done, but re-asserting)
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own friend requests
DROP POLICY IF EXISTS "Users can insert own friendship" ON public.friendships;
CREATE POLICY "Users can insert own friendship" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own friendship requests (received or sent)
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
