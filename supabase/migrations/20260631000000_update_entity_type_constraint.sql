ALTER TABLE public.entity_claims DROP CONSTRAINT IF EXISTS entity_claims_entity_type_check;

ALTER TABLE public.entity_claims ADD CONSTRAINT entity_claims_entity_type_check CHECK (entity_type IN ('artist', 'venue', 'organizer', 'artists', 'venues', 'organizers'));
