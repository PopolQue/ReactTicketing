-- Add 'link' column to notifications for navigation
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Update RLS for UPDATE access (to mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
