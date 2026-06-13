-- Add claiming logic to artists table
ALTER TABLE public.artists 
ADD COLUMN claimed_by_user_id uuid REFERENCES auth.users(id),
ADD COLUMN is_verified boolean DEFAULT false;

-- Create artist_claims table for the review process
CREATE TABLE public.artist_claims (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id uuid REFERENCES public.artists(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    proof_url text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone DEFAULT now()
);

-- RLS for artist_claims
ALTER TABLE public.artist_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims" ON public.artist_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all claims" ON public.artist_claims FOR SELECT USING (
    public.is_superadmin() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can create claims" ON public.artist_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update claims" ON public.artist_claims FOR UPDATE USING (
    public.is_superadmin() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Update RLS for artists to transfer ownership
DROP POLICY IF EXISTS "Organizers manage their artists" ON public.artists;

CREATE POLICY "Organizers manage their unclaimed artists" ON public.artists
USING (auth.uid() = created_by AND claimed_by_user_id IS NULL);

CREATE POLICY "Artists manage their own profiles" ON public.artists
USING (auth.uid() = claimed_by_user_id AND is_verified = true);
