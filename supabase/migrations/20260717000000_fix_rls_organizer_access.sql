-- Migration: Remediate legacy RLS organizer_id checks
-- Creates helper functions and updates broken RLS policies to use claim-based checks.

-- 1. Helper functions
CREATE OR REPLACE FUNCTION public.is_event_organizer(p_event_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organizers o
    JOIN public.events e ON e.organizer_id = o.id
    WHERE e.id = p_event_id 
    AND o.claimed_by_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_claiming_organizer(p_organizer_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organizers o
    WHERE o.id = p_organizer_id 
    AND o.claimed_by_user_id = auth.uid()
  );
$$;

-- 2. Update Policies (using exact original names)
-- ticket_types
DROP POLICY IF EXISTS "Organizers manage own ticket types" ON public.ticket_types;
CREATE POLICY "Organizers manage own ticket types" ON public.ticket_types 
  FOR ALL USING (public.is_event_organizer(event_id))
  WITH CHECK (public.is_event_organizer(event_id));

-- tickets
DROP POLICY IF EXISTS "Organizers view tickets for their events" ON public.tickets;
CREATE POLICY "Organizers view tickets for their events" ON public.tickets 
  FOR SELECT USING (public.is_event_organizer(event_id));

-- event_artists
DROP POLICY IF EXISTS "Organizers manage event artists" ON public.event_artists;
CREATE POLICY "Organizers manage event artists" ON public.event_artists 
  FOR ALL USING (public.is_event_organizer(event_id));

-- scan_accounts
DROP POLICY IF EXISTS "Organizers manage scan accounts" ON public.scan_accounts;
CREATE POLICY "Organizers manage scan accounts" ON public.scan_accounts 
  FOR ALL USING (public.is_event_organizer(event_id));

-- page_views
-- NOTE: If event_id is NULL, this policy currently denies access.
DROP POLICY IF EXISTS "Organizers can view own page views" ON public.page_views;
CREATE POLICY "Organizers can view own page views" ON public.page_views 
  FOR SELECT USING (public.is_event_organizer(event_id));

-- scan_events
DROP POLICY IF EXISTS "Organizers can view scan events" ON public.scan_events;
CREATE POLICY "Organizers can view scan events" ON public.scan_events 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = scan_events.ticket_id AND public.is_event_organizer(t.event_id))
    OR scanned_by_account_id = auth.uid()::text
  );

-- artists (using is_claiming_organizer and unclaimed guard)
DROP POLICY IF EXISTS "Organizers manage their unclaimed artists" ON public.artists;
CREATE POLICY "Organizers manage their unclaimed artists" ON public.artists
  FOR ALL USING (public.is_claiming_organizer(created_by) AND claimed_by_user_id IS NULL);

-- event_checkout_fields
DROP POLICY IF EXISTS "Organizers can manage checkout fields" ON public.event_checkout_fields;
CREATE POLICY "Organizers can manage checkout fields" ON public.event_checkout_fields
  FOR ALL USING (public.is_event_organizer(event_id));
