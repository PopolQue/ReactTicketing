DROP TABLE IF EXISTS public.promo_batches CASCADE;
DROP POLICY IF EXISTS "organizer_manage_promo_codes" ON public.promo_codes;
CREATE POLICY "organizer_manage_promo_codes" ON promo_codes
  FOR ALL USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizer_profiles op ON op.id = e.organizer_id
      WHERE op.id = auth.uid()
    )
  );
