-- Alter tickets table to support delayed delivery
ALTER TABLE tickets ALTER COLUMN qr_payload DROP NOT NULL;
ALTER TABLE tickets ALTER COLUMN status SET DEFAULT 'pending_delivery';

-- Add transfer history column
ALTER TABLE tickets ADD COLUMN transfer_history JSONB DEFAULT '[]'::jsonb;
