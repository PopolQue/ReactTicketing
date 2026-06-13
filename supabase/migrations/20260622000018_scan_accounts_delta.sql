-- supabase/migrations/20260622000018_scan_accounts_delta.sql

-- Check before altering: if these columns already exist in the live schema, skip.
ALTER TABLE scan_accounts
  ADD COLUMN IF NOT EXISTS credential_version  INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS assigned_location   TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pin_salt            TEXT,    -- was PIN stored differently? audit first
  ADD COLUMN IF NOT EXISTS created_by_admin    BOOLEAN NOT NULL DEFAULT TRUE;

-- Existing rows: set credential_version = 1 where null
UPDATE scan_accounts SET credential_version = 1 WHERE credential_version IS NULL;
