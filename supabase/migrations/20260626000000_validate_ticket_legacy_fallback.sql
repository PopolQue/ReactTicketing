-- 20260626000000_validate_ticket_legacy_fallback.sql

CREATE OR REPLACE FUNCTION private.validate_ticket(
  p_ticket_id       TEXT,
  p_scan_account_id TEXT,
  p_session_token   TEXT,
  p_scanned_at      TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ticket          public.tickets%ROWTYPE;
  v_scan_account    public.scan_accounts%ROWTYPE;
  v_clock_skew_secs INTEGER;
  v_actual_ticket_id TEXT := p_ticket_id;
BEGIN
  -- Fallback: If p_ticket_id is actually a full payload (e.g. TF1.eventId.ticketId.signature)
  IF p_ticket_id LIKE 'TF1.%' OR p_ticket_id LIKE 'ADM1.%' THEN
    v_actual_ticket_id := split_part(p_ticket_id, '.', 3);
  END IF;

  -- 1. Fetch and verify scan account is active
  SELECT * INTO v_scan_account FROM public.scan_accounts WHERE id = p_scan_account_id;
  IF NOT FOUND OR v_scan_account.active = FALSE THEN
    RETURN jsonb_build_object('result', 'invalid', 'reason', 'account_inactive');
  END IF;

  -- 3. Fetch ticket
  SELECT * INTO v_ticket FROM public.tickets WHERE id = v_actual_ticket_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('result', 'invalid', 'reason', 'ticket_not_found');
  END IF;

  -- 4. Check ticket status
  IF v_ticket.status = 'used' THEN
    RETURN jsonb_build_object('result', 'already_used');
  END IF;
  IF v_ticket.status = 'cancelled' THEN
    RETURN jsonb_build_object('result', 'cancelled');
  END IF;

  -- 5. Clock skew check
  v_clock_skew_secs := EXTRACT(EPOCH FROM (NOW() - p_scanned_at))::INTEGER;
  IF ABS(v_clock_skew_secs) > 3600 THEN
    RETURN jsonb_build_object('result', 'invalid', 'reason', 'clock_skew_extreme');
  END IF;

  -- 6. Atomic admit with unique constraint
  BEGIN
    INSERT INTO public.scan_events (
      id, ticket_id, scanned_by_account_id, scanned_by_account_name,
      scanned_at, result, clock_skew_seconds, location
    ) VALUES (
      'scan_' || substr(md5(random()::text), 1, 8), v_actual_ticket_id, p_scan_account_id, v_scan_account.username,
      p_scanned_at,
      CASE WHEN ABS(v_clock_skew_secs) > 300 THEN 'clock_skew_anomaly' ELSE 'admitted' END,
      CASE WHEN ABS(v_clock_skew_secs) > 300 THEN v_clock_skew_secs ELSE NULL END,
      v_scan_account.assigned_location
    );
    UPDATE public.tickets SET status = 'used' WHERE id = v_actual_ticket_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('result', 'already_used');
  END;

  RETURN jsonb_build_object(
    'result', CASE WHEN ABS(v_clock_skew_secs) > 300 THEN 'clock_skew_anomaly' ELSE 'admitted' END,
    'clock_skew_seconds', v_clock_skew_secs
  );
END;
$$;
