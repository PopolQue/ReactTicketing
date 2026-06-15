-- 1. Create a webhook function to call the edge function
CREATE OR REPLACE FUNCTION public.trigger_support_email()
RETURNS TRIGGER AS $$
BEGIN
  -- We assume the Edge Function is deployed to the Supabase project
  -- In local development or remote, net.http_post can be used via pg_net
  -- First, ensure the pg_net extension is enabled (already default in Supabase)
  
  -- Use pg_net to invoke the edge function asynchronously
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'net') THEN
    EXECUTE 'SELECT net.http_post(
        url := $1,
        headers := $2,
        body := $3
    )'
    USING 
        coalesce(
            current_setting('app.settings.edge_function_base_url', true),
            'http://127.0.0.1:54321/functions/v1' -- fallback for local
        ) || '/send-support-email',
        jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.service_role_key', true), '')
        ),
        jsonb_build_object('record', row_to_json(NEW));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on support_tickets
DROP TRIGGER IF EXISTS on_support_ticket_created ON public.support_tickets;
CREATE TRIGGER on_support_ticket_created
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_support_email();
