ALTER FUNCTION public.buy_resale_ticket(UUID, UUID) RESET search_path;
ALTER FUNCTION public.generate_ticket_hmac(TEXT, TEXT) RESET search_path;
ALTER FUNCTION public.get_artist_analytics(UUID) RESET search_path;
ALTER FUNCTION public.increment_promo_usage(TEXT) RESET search_path;
ALTER FUNCTION public.promote_admin_by_email(TEXT) RESET search_path;
ALTER FUNCTION public.validate_ticket(TEXT, TEXT, TEXT, TIMESTAMPTZ) RESET search_path;
