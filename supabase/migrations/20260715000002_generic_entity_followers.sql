-- Drop the previous organizer-specific table
DROP TABLE IF EXISTS organizer_followers;

-- 1. Create a generic Entity Followers table
CREATE TABLE IF NOT EXISTS entity_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    entity_id UUID NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'organizer', 'venue', 'event')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, entity_id, entity_type)
);

ALTER TABLE entity_followers ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Followers can view their own follows' AND tablename = 'entity_followers') THEN
        CREATE POLICY "Followers can view their own follows" ON entity_followers FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can follow entities' AND tablename = 'entity_followers') THEN
        CREATE POLICY "Users can follow entities" ON entity_followers FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can unfollow entities' AND tablename = 'entity_followers') THEN
        CREATE POLICY "Users can unfollow entities" ON entity_followers FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Optional: Add index for performance on queries like "count followers for artist"
CREATE INDEX IF NOT EXISTS idx_entity_followers_lookup ON entity_followers(entity_id, entity_type);
