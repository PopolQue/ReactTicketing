-- Allow the public to view ticket details IF the ticket is actively listed for resale
-- This is necessary because tickets are normally restricted to their owners, but the secondary market needs to display the ticket info to prospective buyers.

CREATE POLICY "Public view tickets for active resale" ON tickets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM resale_listings 
    WHERE resale_listings.ticket_id = tickets.id 
    AND resale_listings.is_active = true
  )
);
