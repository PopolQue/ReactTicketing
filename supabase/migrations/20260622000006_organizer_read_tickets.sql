-- Allow Organizers to read the details of tickets for their own events.
-- This is critical for the Ticket Scanner and Dashboard Analytics features, as they need to query the tickets table.

CREATE POLICY "Organizers view tickets for their events" ON tickets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = tickets.event_id 
    AND events.organizer_id = auth.uid()
  )
);
