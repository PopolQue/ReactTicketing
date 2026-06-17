-- 1. Organizer Followers
CREATE TABLE IF NOT EXISTS organizer_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    organizer_id UUID NOT NULL REFERENCES organizers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, organizer_id)
);

ALTER TABLE organizer_followers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Followers can view their own follows' AND tablename = 'organizer_followers') THEN
        CREATE POLICY "Followers can view their own follows" ON organizer_followers FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can follow organizers' AND tablename = 'organizer_followers') THEN
        CREATE POLICY "Users can follow organizers" ON organizer_followers FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can unfollow organizers' AND tablename = 'organizer_followers') THEN
        CREATE POLICY "Users can unfollow organizers" ON organizer_followers FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Ticket Issuance Fields
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS qr_payload TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE;

-- 3. Cron Job (pg_cron)
-- Note: This assumes pg_cron extension is enabled on the Supabase project.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'issue-tickets-daily') THEN
    PERFORM cron.schedule(
        'issue-tickets-daily',
        '0 0 * * *', -- Daily at midnight
        'UPDATE tickets SET qr_payload = ''SECURE_HMAC_...'' || id, issued_at = now() FROM events WHERE tickets.event_id = events.id AND events.start_time <= now() + interval ''48 hours'' AND tickets.qr_payload IS NULL'
    );
  END IF;
END $$;
