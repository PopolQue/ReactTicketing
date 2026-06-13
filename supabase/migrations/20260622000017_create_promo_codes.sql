-- supabase/migrations/20260622000017_create_promo_codes.sql

CREATE TABLE promo_codes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  discount_kind TEXT NOT NULL CHECK (discount_kind IN ('percent_off','amount_off','free')),
  discount_value INTEGER,               -- null for 'free'
  applies_to    TEXT[],                 -- null = all ticket types
  max_uses      INTEGER,               -- null = unlimited
  used_count    INTEGER NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  batch_id      UUID,
  CONSTRAINT promo_codes_event_code_unique UNIQUE (event_id, code)
);

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Organizers can read/write their own event's codes
CREATE POLICY "organizer_manage_promo_codes" ON promo_codes
  FOR ALL USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizer_profiles op ON op.id = e.organizer_id
      WHERE op.id = auth.uid()
    )
  );

-- Buyers can read active codes (for storefront validation display only)
CREATE POLICY "public_read_active_promo_codes" ON promo_codes
  FOR SELECT USING (active = TRUE);
