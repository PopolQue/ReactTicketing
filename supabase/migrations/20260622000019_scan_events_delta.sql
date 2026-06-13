-- supabase/migrations/20260622000019_scan_events_delta.sql

ALTER TABLE scan_events
  ADD COLUMN IF NOT EXISTS clock_skew_seconds       INTEGER,
  ADD COLUMN IF NOT EXISTS scanned_by_account_name  TEXT,  -- denormalised at write time
  ADD COLUMN IF NOT EXISTS result                   TEXT
    CHECK (result IN (
      'admitted','already_used','invalid','expired','cancelled','clock_skew_anomaly'
    )),
  ADD COLUMN IF NOT EXISTS location                 TEXT;

-- Note: The existing dump shows:
-- "result" "text" NOT NULL
-- "scanned_by_account_name" "text" NOT NULL
-- So if they already exist without constraints or with different constraints, this ALTER ADD COLUMN IF NOT EXISTS will just be ignored for those columns.
