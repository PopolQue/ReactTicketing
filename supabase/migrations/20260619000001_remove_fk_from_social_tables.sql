-- Remove FK constraints that reference non-existent tables
-- This migration removes the problematic FK constraints from the social tables
-- They will be re-added in a later migration once the referenced tables exist

ALTER TABLE IF EXISTS public.posts DROP CONSTRAINT IF EXISTS posts_event_id_fkey;
ALTER TABLE IF EXISTS public.ticket_transfers DROP CONSTRAINT IF EXISTS ticket_transfers_ticket_id_fkey;
