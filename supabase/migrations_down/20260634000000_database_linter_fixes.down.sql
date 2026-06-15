ALTER FUNCTION public.update_ticket_type_sold_count() RESET search_path;
ALTER FUNCTION public.trigger_support_email() RESET search_path;
ALTER FUNCTION public.process_resale_phase_shifts() RESET search_path;
ALTER FUNCTION public.claim_invite(text) RESET search_path;
ALTER FUNCTION public.revoke_invite(uuid) RESET search_path;
ALTER FUNCTION public.generate_ticket_hmac(text, text) RESET search_path;
ALTER FUNCTION public.create_checkout_transaction(jsonb, jsonb) RESET search_path;

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT WITH CHECK (true);

GRANT EXECUTE ON FUNCTION public.claim_invite(text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_ticket_hmac(text, text) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_resale_phase_shifts() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_invite(uuid) TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.trigger_support_email() TO anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_transaction(jsonb, jsonb) TO anon, PUBLIC;
