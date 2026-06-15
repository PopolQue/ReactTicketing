ALTER TABLE public.scan_events
  DROP COLUMN IF EXISTS clock_skew_seconds,
  DROP COLUMN IF EXISTS scanned_by_account_name,
  DROP COLUMN IF EXISTS result,
  DROP COLUMN IF EXISTS location;
