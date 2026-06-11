-- Allow fans to insert their own tickets upon purchase
CREATE POLICY "Fans insert own tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = owner_id);
