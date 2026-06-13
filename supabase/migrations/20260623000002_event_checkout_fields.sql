CREATE TABLE IF NOT EXISTS public.event_checkout_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    field_type TEXT NOT NULL CHECK (field_type IN ('TEXT', 'EMAIL', 'PHONE', 'AGE', 'COUNTRY', 'ZIP')),
    label TEXT NOT NULL,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.event_checkout_fields ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Checkout fields are viewable by everyone" ON public.event_checkout_fields
    FOR SELECT USING (true);

CREATE POLICY "Organizers can manage checkout fields" ON public.event_checkout_fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_checkout_fields.event_id
            AND events.organizer_id = auth.uid()
        )
    );
