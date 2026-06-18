-- Add DELETE policy for friendships
CREATE POLICY "Users can delete own friendships" ON public.friendships 
FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);
