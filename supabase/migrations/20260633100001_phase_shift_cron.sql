-- Function to shift waitlist to open market
CREATE OR REPLACE FUNCTION public.process_resale_phase_shifts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    listing RECORD;
    v_event RECORD;
    v_hours_until REAL;
BEGIN
    -- Loop through all active non-sold resale listings
    FOR listing IN 
        SELECT rl.*, t.event_id 
        FROM public.resale_listings rl
        JOIN public.tickets t ON rl.ticket_id = t.id
        WHERE rl.status IN ('listed', 'offered')
    LOOP
        -- Get event info
        SELECT starts_at, open_market_threshold_hours INTO v_event FROM public.events WHERE id = listing.event_id;
        
        v_hours_until := EXTRACT(EPOCH FROM (v_event.starts_at - NOW())) / 3600.0;
        
        IF v_hours_until <= v_event.open_market_threshold_hours THEN
            -- Phase 2: Liquidity Mode (Open Market)
            IF listing.status != 'open_market' THEN
                UPDATE public.resale_listings 
                SET status = 'open_market', offered_to_user_id = NULL, expires_at = NULL 
                WHERE id = listing.id;
                
                -- Here we would trigger an edge function via webhook to blast SMS
            END IF;
        ELSE
            -- Phase 1: Fairness Mode
            IF listing.status = 'offered' AND listing.expires_at < NOW() THEN
                -- Offer expired, pass to next waitlist user
                -- Find next waitlist user (simplified logic assuming we have a waitlist table, or just revert to 'listed' for edge function to pick up)
                UPDATE public.resale_listings 
                SET status = 'listed', offered_to_user_id = NULL, expires_at = NULL 
                WHERE id = listing.id;
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- Note: In a real environment, we would use pg_cron here:
-- SELECT cron.schedule('process-resales', '* * * * *', $$SELECT public.process_resale_phase_shifts()$$);
