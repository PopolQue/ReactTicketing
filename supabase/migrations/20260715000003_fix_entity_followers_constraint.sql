-- Fix the check constraint to include 'event'
ALTER TABLE entity_followers 
DROP CONSTRAINT IF EXISTS entity_followers_entity_type_check;

ALTER TABLE entity_followers 
ADD CONSTRAINT entity_followers_entity_type_check 
CHECK (entity_type IN ('artist', 'organizer', 'venue', 'event'));
