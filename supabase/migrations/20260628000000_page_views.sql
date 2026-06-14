CREATE TABLE public.page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES public.organizers(id),
    visitor_id TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views" ON public.page_views 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Organizers can view own page views" ON public.page_views 
FOR SELECT USING (organizer_id = auth.uid());

CREATE INDEX idx_page_views_event_id ON public.page_views(event_id);
CREATE INDEX idx_page_views_organizer_id ON public.page_views(organizer_id);
