DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'friendships_user_id_fkey') THEN
        ALTER TABLE public.friendships ADD CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'friendships_friend_id_fkey') THEN
        ALTER TABLE public.friendships ADD CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.user_profiles(id);
    END IF;
END $$;
