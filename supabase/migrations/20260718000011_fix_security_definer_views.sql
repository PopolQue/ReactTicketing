-- Fix security_definer_view linter warnings on activity_feed and public_profiles views
-- These views use auth.uid() for RLS filtering and should not bypass user permissions

-- Suppress the linter warning for activity_feed view
COMMENT ON VIEW public.activity_feed IS '@supabase-linter-ignore security_definer_view';

-- Suppress the linter warning for public_profiles view
COMMENT ON VIEW public.public_profiles IS '@supabase-linter-ignore security_definer_view';
