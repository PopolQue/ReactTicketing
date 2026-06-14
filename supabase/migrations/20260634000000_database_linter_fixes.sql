-- 1. Fix Function Search Path Mutable
ALTER FUNCTION public.update_ticket_type_sold_count() SET search_path = public;
ALTER FUNCTION public.trigger_support_email() SET search_path = public;
ALTER FUNCTION public.process_resale_phase_shifts() SET search_path = public;
ALTER FUNCTION public.claim_invite(text) SET search_path = public;
ALTER FUNCTION public.revoke_invite(uuid) SET search_path = public;
ALTER FUNCTION public.generate_ticket_hmac(text, text) SET search_path = public;
ALTER FUNCTION public.create_checkout_transaction(jsonb, jsonb) SET search_path = public;

-- 2. Fix RLS Policy Always True for page_views
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT WITH CHECK (
  auth.role() IN ('anon', 'authenticated')
);

-- 3. Fix Public Can Execute SECURITY DEFINER Function (anon role)
REVOKE EXECUTE ON FUNCTION public.claim_invite(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_invite(text) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.generate_ticket_hmac(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_ticket_hmac(text, text) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.process_resale_phase_shifts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_resale_phase_shifts() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.revoke_invite(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_invite(uuid) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.trigger_support_email() FROM anon;
REVOKE EXECUTE ON FUNCTION public.trigger_support_email() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.create_checkout_transaction(jsonb, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_checkout_transaction(jsonb, jsonb) FROM PUBLIC;

-- 4. Re-grant to authenticated or service roles as appropriate
GRANT EXECUTE ON FUNCTION public.claim_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkout_transaction(jsonb, jsonb) TO authenticated;
-- generate_ticket_hmac might be needed by authenticated if organizers generate tickets from their portal
GRANT EXECUTE ON FUNCTION public.generate_ticket_hmac(text, text) TO authenticated;
-- trigger_support_email and process_resale_phase_shifts don't need any explicit EXECUTE grants as they are internal triggers/cron functions.

