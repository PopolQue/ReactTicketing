-- Add UPDATE policy for friendships
CREATE POLICY "Users can update own friendships" ON public.friendships 
FOR UPDATE USING (auth.uid() = friend_id)
WITH CHECK (auth.uid() = friend_id);
