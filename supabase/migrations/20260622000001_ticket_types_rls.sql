-- Enable RLS for ticket_types
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;

-- Allow public to read ticket_types
CREATE POLICY "Public read ticket_types" 
ON ticket_types FOR SELECT 
USING (true);

-- Allow organizers to manage ticket types for their own events
CREATE POLICY "Organizers manage own ticket types" 
ON ticket_types FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = ticket_types.event_id 
    AND events.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = ticket_types.event_id 
    AND events.organizer_id = auth.uid()
  )
);
