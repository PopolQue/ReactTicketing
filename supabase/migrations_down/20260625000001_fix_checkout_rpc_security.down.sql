ALTER FUNCTION public.create_tickets_transaction(JSONB) RESET search_path;
ALTER FUNCTION public.create_checkout_transaction(JSONB, JSONB) RESET search_path;
GRANT EXECUTE ON FUNCTION public.create_tickets_transaction(JSONB) TO public, anon;
GRANT EXECUTE ON FUNCTION public.create_checkout_transaction(JSONB, JSONB) TO public, anon;
