-- Migration: Fix Supabase Linter Warnings
-- Addresses security warnings regarding mutable search paths and authenticated SECURITY DEFINER execution.

-- 1. Fix: function_search_path_mutable
-- These functions lack an explicit search_path, leaving them vulnerable to search path hijacking.
ALTER FUNCTION public.process_resale_phase_shifts() SET search_path = public;
ALTER FUNCTION public.update_ticket_type_sold_count() SET search_path = public;
ALTER FUNCTION public.issue_tickets_if_not_issued(TEXT, TEXT) SET search_path = public;

-- 2. Fix: authenticated_security_definer_function_executable (approve_entity_claim)
-- We need to ensure that only admins can actually execute the claim approval logic,
-- because previously we granted EXECUTE to all authenticated users without an internal check.
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
    -- SECURITY CHECK: Only admins or superadmins can approve claims
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    ) AND NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Insufficient permissions to approve claims';
    END IF;

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

-- Since we've secured the function internally, we can suppress the linter warning.
COMMENT ON FUNCTION public.approve_entity_claim(UUID) IS '@supabase-linter-disable authenticated_security_definer_function_executable';


-- 3. Fix: authenticated_security_definer_function_executable (claim_invite & revoke_invite)
-- These functions MUST be SECURITY DEFINER to modify role/member tables the user doesn't own yet,
-- and they intentionally do their own authorization checks (token matching or admin verification).
COMMENT ON FUNCTION public.claim_invite(TEXT) IS '@supabase-linter-disable authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.revoke_invite(UUID) IS '@supabase-linter-disable authenticated_security_definer_function_executable';
