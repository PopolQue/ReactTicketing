DROP TABLE IF EXISTS public.writer_applications CASCADE;
DROP TABLE IF EXISTS public.writer_profiles CASCADE;

DROP POLICY IF EXISTS "Authors manage their blogs" ON public.blogs;
ALTER TABLE public.blogs ADD CONSTRAINT blogs_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.organizer_profiles(id);
