-- User Roles Table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Superadmins can manage all roles
CREATE POLICY "Superadmins can manage roles" ON public.user_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'superadmin'
        )
    );

-- Admins and Superadmins can read roles
CREATE POLICY "Admins can read roles" ON public.user_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- Support Tickets
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can create a support ticket
CREATE POLICY "Anyone can create tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (true);

-- Admins can read and update tickets
CREATE POLICY "Admins manage tickets" ON public.support_tickets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- Users can read their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Support Ticket Messages
CREATE TABLE public.support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null if sent by unauthenticated user
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can reply to an existing ticket if they have the ID (or we can restrict to creator/admin)
CREATE POLICY "Users can read/write ticket messages" ON public.support_ticket_messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE id = ticket_id AND (user_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'superadmin')))
        )
    );

-- Update Events Table for Approval Flow
ALTER TABLE public.events
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Automatically mark existing published events as approved so they don't disappear
UPDATE public.events SET approval_status = 'approved' WHERE published = TRUE;

-- Allow Admins to manage events fully
CREATE POLICY "Admins can manage all events" ON public.events
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );
