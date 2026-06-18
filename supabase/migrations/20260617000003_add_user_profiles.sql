-- Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view profiles
CREATE POLICY "Users can view profiles" ON public.user_profiles FOR SELECT USING (true);

-- Update the public_profiles view to use this table
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    id,
    username
FROM public.user_profiles;

-- Seed existing users if necessary (placeholder, users should manage their own profiles)
