-- supabase-lint-ignore anon_security_definer_function_executable
-- supabase-lint-ignore authenticated_security_definer_function_executable
CREATE OR REPLACE FUNCTION public.get_artist_analytics(artist_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner UUID;
  v_total_tickets INT;
  v_countries JSONB;
  v_ages JSONB;
BEGIN
  -- Verify ownership
  SELECT claimed_by_user_id INTO v_owner FROM public.artists WHERE id = artist_id_param;
  IF v_owner IS NULL OR v_owner != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to view analytics for this artist.';
  END IF;

  -- Total tickets sold across all their events
  SELECT COUNT(*) INTO v_total_tickets
  FROM public.tickets t
  JOIN public.event_artists ea ON ea.event_id = t.event_id
  WHERE ea.artist_id = artist_id_param
  AND t.status = 'valid';

  -- Aggregate by Country
  SELECT COALESCE(jsonb_object_agg(country, count), '{}'::jsonb) INTO v_countries
  FROM (
    SELECT COALESCE(t.personalization->>'Country', 'Unknown') as country, COUNT(*) as count
    FROM public.tickets t
    JOIN public.event_artists ea ON ea.event_id = t.event_id
    WHERE ea.artist_id = artist_id_param AND t.status = 'valid'
    GROUP BY 1
    ORDER BY count DESC
    LIMIT 10
  ) sub;

  -- Aggregate by Age
  SELECT COALESCE(jsonb_object_agg(age, count), '{}'::jsonb) INTO v_ages
  FROM (
    SELECT COALESCE(t.personalization->>'Age', 'Unknown') as age, COUNT(*) as count
    FROM public.tickets t
    JOIN public.event_artists ea ON ea.event_id = t.event_id
    WHERE ea.artist_id = artist_id_param AND t.status = 'valid'
    GROUP BY 1
    ORDER BY count DESC
    LIMIT 10
  ) sub;

  RETURN jsonb_build_object(
    'total_tickets', v_total_tickets,
    'demographics', jsonb_build_object(
      'countries', v_countries,
      'ages', v_ages
    )
  );
END;
$$;
