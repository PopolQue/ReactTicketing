-- Create a public view for user profiles to allow searching without exposing auth.users
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'username', email) AS username
FROM auth.users;

GRANT SELECT ON public.public_profiles TO authenticated;
