ALTER TABLE public.entity_claims DROP CONSTRAINT IF EXISTS entity_claims_status_check;
ALTER TABLE public.entity_claims ADD CONSTRAINT entity_claims_status_check CHECK (status IN ('pending', 'approved', 'rejected'));
