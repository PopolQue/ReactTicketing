-- supabase/migrations/20260622000023_cleanup_expired_promos.sql

-- Assume pg_cron is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Create function to deactivate expired promos
CREATE OR REPLACE FUNCTION cleanup_expired_promos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promo_codes
  SET active = false
  WHERE expires_at IS NOT NULL AND expires_at < NOW() AND active = true;
END;
$$;

-- Schedule it to run daily
-- NOTE: Un-comment the line below if you are running this in a real Supabase environment
-- SELECT cron.schedule('cleanup-expired-promos', '0 0 * * *', 'SELECT cleanup_expired_promos()');
