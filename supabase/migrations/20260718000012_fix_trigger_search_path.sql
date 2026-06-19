CREATE OR REPLACE FUNCTION public.trg_set_ticket_qr_payload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.qr_payload IS NULL THEN
    NEW.qr_payload := public.generate_ticket_hmac(NEW.event_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
