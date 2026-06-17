-- Migration: Rollback legacy RLS organizer_id check fix
-- Drops helper functions and restores previous RLS policies.

-- 1. Restore original policies (using exact original names)
-- ticket_types
DROP POLICY IF EXISTS "Organizers manage own ticket types" ON public.ticket_types;
CREATE POLICY "Organizers manage own ticket types" ON public.ticket_types 
  FOR ALL USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = ticket_types.event_id AND e.organizer_id = auth.uid()));

-- tickets
DROP POLICY IF EXISTS "Organizers view tickets for their events" ON public.tickets;
CREATE POLICY "Organizers view tickets for their events" ON public.tickets 
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = tickets.event_id AND e.organizer_id = auth.uid()));

-- event_artists
DROP POLICY IF EXISTS "Organizers manage event artists" ON public.event_artists;
CREATE POLICY "Organizers manage event artists" ON public.event_artists 
  FOR ALL USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_artists.event_id AND e.organizer_id = auth.uid()));

-- scan_accounts
DROP POLICY IF EXISTS "Organizers manage scan accounts" ON public.scan_accounts;
CREATE POLICY "Organizers manage scan accounts" ON public.scan_accounts 
  FOR ALL USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = scan_accounts.event_id AND e.organizer_id = auth.uid()));

-- page_views
DROP POLICY IF EXISTS "Organizers can view own page views" ON public.page_views;
CREATE POLICY "Organizers can view own page views" ON public.page_views 
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = page_views.event_id AND e.organizer_id = auth.uid()));

-- scan_events
DROP POLICY IF EXISTS "Organizers can view scan events" ON public.scan_events;
CREATE POLICY "Organizers can view scan events" ON public.scan_events 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tickets t JOIN public.events e ON t.event_id = e.id WHERE t.id = scan_events.ticket_id AND e.organizer_id = auth.uid())
    OR scanned_by_account_id = auth.uid()::text
  );

-- artists
DROP POLICY IF EXISTS "Organizers manage their unclaimed artists" ON public.artists;
CREATE POLICY "Organizers manage their unclaimed artists" ON public.artists
  FOR ALL USING (auth.uid() = created_by AND claimed_by_user_id IS NULL);

-- event_checkout_fields
DROP POLICY IF EXISTS "Organizers can manage checkout fields" ON public.event_checkout_fields;
CREATE POLICY "Organizers can manage checkout fields" ON public.event_checkout_fields
  FOR ALL USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_checkout_fields.event_id AND e.organizer_id = auth.uid()));

-- 2. Drop helper functions
DROP FUNCTION IF EXISTS public.is_event_organizer(p_event_id TEXT);
DROP FUNCTION IF EXISTS public.is_claiming_organizer(p_organizer_id UUID);
