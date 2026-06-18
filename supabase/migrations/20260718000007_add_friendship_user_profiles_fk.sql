-- Fix relationship between friendships and user_profiles
ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) NOT VALID;

ALTER TABLE public.friendships 
VALIDATE CONSTRAINT friendships_user_id_profiles_fkey;

ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_friend_id_profiles_fkey 
FOREIGN KEY (friend_id) REFERENCES public.user_profiles(id) NOT VALID;

ALTER TABLE public.friendships 
VALIDATE CONSTRAINT friendships_friend_id_profiles_fkey;
