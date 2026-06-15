GRANT EXECUTE ON FUNCTION public.process_resale_phase_shifts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_support_email() TO authenticated;

COMMENT ON FUNCTION public.claim_invite(text) IS NULL;
COMMENT ON FUNCTION public.create_checkout_transaction(jsonb, jsonb) IS NULL;
COMMENT ON FUNCTION public.revoke_invite(uuid) IS NULL;
COMMENT ON FUNCTION public.generate_ticket_hmac(text, text) IS NULL;
