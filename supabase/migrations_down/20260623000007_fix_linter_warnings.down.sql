ALTER FUNCTION public.trg_set_ticket_qr_payload() RESET search_path;
ALTER FUNCTION public.cleanup_expired_promos() RESET search_path;
ALTER FUNCTION public.trg_enforce_price_cap() RESET search_path;
ALTER FUNCTION public.check_ticket_resellable() RESET search_path;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_promos() TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_artist_analytics(uuid) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_enforce_price_cap() TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_set_ticket_qr_payload() TO PUBLIC, anon, authenticated;
