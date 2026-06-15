ALTER TABLE public.scan_accounts 
  DROP COLUMN IF EXISTS credential_version,
  DROP COLUMN IF EXISTS assigned_location,
  DROP COLUMN IF EXISTS last_login_at,
  DROP COLUMN IF EXISTS pin_salt,
  DROP COLUMN IF EXISTS created_by_admin;
