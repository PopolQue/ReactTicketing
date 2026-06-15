DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
ALTER TABLE public.events DROP COLUMN IF EXISTS approval_status, DROP COLUMN IF EXISTS reviewed_by;
DROP TABLE IF EXISTS public.support_ticket_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
