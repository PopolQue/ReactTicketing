-- Function to create notification
CREATE OR REPLACE FUNCTION public.handle_new_friendship()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.friend_id, 'New Friend Request', 'You have received a new friend request.', 'friend_request');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER on_friendship_created
AFTER INSERT ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.handle_new_friendship();
