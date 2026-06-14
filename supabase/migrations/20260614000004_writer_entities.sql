-- Create writer_profiles table
CREATE TABLE IF NOT EXISTS public.writer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pen_name TEXT NOT NULL,
    bio TEXT,
    image_url TEXT,
    verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.writer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Writers manage own profile" ON public.writer_profiles;
CREATE POLICY "Writers manage own profile" ON public.writer_profiles USING (auth.uid() = id);
DROP POLICY IF EXISTS "Public read writer_profiles" ON public.writer_profiles;
CREATE POLICY "Public read writer_profiles" ON public.writer_profiles FOR SELECT USING (true);

-- Create writer_applications table
CREATE TABLE IF NOT EXISTS public.writer_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pen_name TEXT NOT NULL,
    bio TEXT,
    samples TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.writer_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own applications" ON public.writer_applications;
CREATE POLICY "Users view own applications" ON public.writer_applications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own applications" ON public.writer_applications;
CREATE POLICY "Users insert own applications" ON public.writer_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins manage applications" ON public.writer_applications;
CREATE POLICY "Admins manage applications" ON public.writer_applications USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- Fix blogs foreign key
ALTER TABLE public.blogs DROP CONSTRAINT IF EXISTS blogs_author_id_fkey;
-- Note: author_id is now just a UUID that could point to organizer_profiles or writer_profiles.

-- Update blogs RLS to allow writers to manage their own blogs
DROP POLICY IF EXISTS "Organizers manage their blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors manage their blogs" ON public.blogs;

CREATE POLICY "Authors manage their blogs" ON public.blogs
  USING (auth.uid() = author_id);
