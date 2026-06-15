DROP POLICY IF EXISTS "Public read ticket_types" ON public.ticket_types;
DROP POLICY IF EXISTS "Organizers manage own ticket types" ON public.ticket_types;
ALTER TABLE public.ticket_types DISABLE ROW LEVEL SECURITY;
