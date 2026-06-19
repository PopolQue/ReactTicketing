-- Migration: add social FKs after events/tickets exist
-- Created: 2026-06-19

-- This migration adds FK constraints for posts.event_id -> events(id)
-- and ticket_transfers.ticket_id -> tickets(id) in a safe, idempotent way.

DO $$
BEGIN
  -- Add FK for posts.event_id if events table exists and constraint not present
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='events' AND relnamespace = 'public'::regnamespace) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_event_id_fkey') THEN
      ALTER TABLE public.posts
      ADD CONSTRAINT posts_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  -- Add FK for ticket_transfers.ticket_id if tickets table exists and constraint not present
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='tickets' AND relnamespace = 'public'::regnamespace) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ticket_transfers_ticket_id_fkey') THEN
      ALTER TABLE public.ticket_transfers
      ADD CONSTRAINT ticket_transfers_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);
    END IF;
  END IF;
END$$;
