-- Migration: Architectural Debt Remediation
-- Fixes critical data model vulnerabilities identified during the architecture audit.

-- 1. PREVENT FINANCIAL DATA LOSS (Remove CASCADE deletes on orders and tickets)
-- First, drop the existing cascading constraints
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_event_id_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_event_id_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_order_id_fkey;

-- Re-add constraints with RESTRICT to prevent hard deletion of financial records
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;

ALTER TABLE public.tickets 
  ADD CONSTRAINT tickets_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;

ALTER TABLE public.tickets 
  ADD CONSTRAINT tickets_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

-- Add a soft-delete column to events to allow archiving instead of hard deletion
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;


-- 2. SECURE ORDER ATTRIBUTION (Add proper foreign key for buyers)
-- Add the explicit user link
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_user_id UUID REFERENCES auth.users(id);

-- Update RLS policies to use the new UUID link as the primary check, falling back to email
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders 
  FOR SELECT USING (
    buyer_user_id = auth.uid() OR 
    buyer_email = auth.jwt()->>'email'
  );

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders" ON public.orders 
  FOR INSERT WITH CHECK (
    (buyer_user_id = auth.uid() OR buyer_user_id IS NULL) AND
    buyer_email = auth.jwt()->>'email'
  );


-- 3. PROMO CODE REFERENTIAL INTEGRITY (Migrate from TEXT[] to Join Table)
-- Create the proper join table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.promo_code_ticket_types (
    promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    ticket_type_id TEXT NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
    PRIMARY KEY (promo_code_id, ticket_type_id)
);

-- Backfill data from the loose array into the new join table
INSERT INTO public.promo_code_ticket_types (promo_code_id, ticket_type_id)
SELECT id, unnest(applies_to)
FROM public.promo_codes
WHERE applies_to IS NOT NULL AND array_length(applies_to, 1) > 0
ON CONFLICT DO NOTHING;

-- NOTE: We are NOT dropping the `applies_to` array column yet to allow the 
-- frontend team time to migrate to the new `promo_code_ticket_types` join table.


-- 4. ATOMIC ENTITY CLAIM ARCHITECTURE
-- Create a secure RPC to handle claim approval and access-granting atomically
CREATE OR REPLACE FUNCTION public.approve_entity_claim(p_claim_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entity_id UUID;
    v_entity_type TEXT;
    v_user_id UUID;
    v_status TEXT;
BEGIN
    -- Lock the claim row to prevent race conditions
    SELECT entity_id, entity_type, user_id, status 
    INTO v_entity_id, v_entity_type, v_user_id, v_status
    FROM public.entity_claims 
    WHERE id = p_claim_id 
    FOR UPDATE;

    IF NOT FOUND THEN 
        RAISE EXCEPTION 'Claim not found'; 
    END IF;

    IF v_status = 'approved' THEN 
        RETURN TRUE; -- Idempotent
    END IF;

    -- 1. Update the claim status
    UPDATE public.entity_claims 
    SET status = 'approved', updated_at = NOW() 
    WHERE id = p_claim_id;

    -- 2. Atomically grant access to the requested entity
    IF v_entity_type = 'artist' THEN
        UPDATE public.artists SET claimed_by_user_id = v_user_id WHERE id = v_entity_id;
    ELSIF v_entity_type = 'venue' THEN
        UPDATE public.venues SET claimed_by_user_id = v_user_id WHERE id = v_entity_id;
    ELSIF v_entity_type = 'organizer' THEN
        UPDATE public.organizers SET claimed_by_user_id = v_user_id WHERE id = v_entity_id;
    ELSE
        RAISE EXCEPTION 'Invalid entity_type: %', v_entity_type;
    END IF;

    RETURN TRUE;
END;
$$;

-- Ensure only authenticated users can attempt to invoke this (further restricted by RLS/App logic)
REVOKE EXECUTE ON FUNCTION public.approve_entity_claim(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_entity_claim(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_entity_claim(UUID) TO authenticated;
