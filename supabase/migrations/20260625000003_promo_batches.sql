CREATE TABLE IF NOT EXISTS promo_batches (
  id UUID PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  codes JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE promo_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizer_manage_promo_batches" ON promo_batches
  FOR ALL USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers op ON op.id = e.organizer_id
      WHERE op.claimed_by_user_id = auth.uid()
    )
  );

-- Also fix promo_codes RLS which was broken by the entity claim architecture rename
DROP POLICY IF EXISTS "organizer_manage_promo_codes" ON promo_codes;
CREATE POLICY "organizer_manage_promo_codes" ON promo_codes
  FOR ALL USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers op ON op.id = e.organizer_id
      WHERE op.claimed_by_user_id = auth.uid()
    )
  );
