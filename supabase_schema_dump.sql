


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "private"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_old_ticket tickets%ROWTYPE;
    v_is_active BOOLEAN;
    v_asking_price INTEGER;
    v_new_ticket_id TEXT;
    v_buyer_email TEXT;
BEGIN
    -- 1. Lock the listing
    SELECT is_active, asking_price_cents INTO v_is_active, v_asking_price
    FROM resale_listings 
    WHERE id = p_listing_id 
    FOR UPDATE;

    IF NOT FOUND OR NOT v_is_active THEN
        RAISE EXCEPTION 'Listing is no longer active or does not exist';
    END IF;

    -- Fetch the old ticket
    SELECT * INTO v_old_ticket
    FROM tickets
    WHERE id = (SELECT ticket_id FROM resale_listings WHERE id = p_listing_id);

    IF v_old_ticket.status != 'valid' THEN
        RAISE EXCEPTION 'Ticket is not valid for transfer';
    END IF;

    -- 2. Mark listing as inactive
    UPDATE resale_listings SET is_active = FALSE WHERE id = p_listing_id;

    -- 3. Invalidate the old ticket
    UPDATE tickets SET status = 'transferred' WHERE id = v_old_ticket.id;

    -- 4. Get the buyer email (using auth schema requires access, so we do it silently and fallback)
    -- As a SECURITY DEFINER, we have access to auth.users if we run as postgres
    BEGIN
        SELECT email INTO v_buyer_email FROM auth.users WHERE id = p_buyer_id;
    EXCEPTION WHEN OTHERS THEN
        v_buyer_email := v_old_ticket.buyer_email;
    END;

    IF v_buyer_email IS NULL THEN
        v_buyer_email := v_old_ticket.buyer_email;
    END IF;

    -- 5. Mint a brand new ticket (Cryptographic Escrow Transfer)
    -- trigger_set_ticket_qr_payload will auto-generate the new HMAC
    v_new_ticket_id := gen_random_uuid()::TEXT;
    
    INSERT INTO tickets (
        id, 
        event_id, 
        ticket_type_id, 
        order_id, 
        personalization, 
        buyer_email, 
        valid_from, 
        valid_until, 
        status, 
        price_paid_cents, 
        owner_id
    ) VALUES (
        v_new_ticket_id,
        v_old_ticket.event_id,
        v_old_ticket.ticket_type_id,
        v_old_ticket.order_id, 
        v_old_ticket.personalization, 
        v_buyer_email,
        v_old_ticket.valid_from,
        v_old_ticket.valid_until,
        'valid',
        v_asking_price,
        p_buyer_id
    );

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "private"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."claim_invite"("p_raw_token" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_token_hash TEXT;
  v_invite invite_links%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'claim_invite requires an authenticated session';
  END IF;

  v_token_hash := encode(digest(p_raw_token, 'sha256'), 'hex');

  SELECT * INTO v_invite FROM invite_links WHERE token_hash = v_token_hash FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_invite.status NOT IN ('pending') OR v_invite.use_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_claimable', 'status', v_invite.status);
  END IF;

  IF v_invite.expires_at < NOW() THEN
    UPDATE invite_links SET status = 'expired', updated_at = NOW() WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;

  IF EXISTS (SELECT 1 FROM invite_link_claims WHERE invite_id = v_invite.id AND accepted_by_user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  IF v_invite.entity_type = 'organizer' THEN
    UPDATE public.organizers SET claimed_by_user_id = v_user_id WHERE id = v_invite.entity_id::UUID;
  ELSIF v_invite.entity_type = 'artist' THEN
    INSERT INTO public.artist_members (artist_id, user_id, role)
    VALUES (v_invite.entity_id::UUID, v_user_id, 'member')
    ON CONFLICT (artist_id, user_id) DO NOTHING;
  ELSIF v_invite.entity_type = 'venue' THEN
    UPDATE public.venues SET claimed_by_user_id = v_user_id WHERE id = v_invite.entity_id::UUID;
  END IF;

  INSERT INTO user_roles (user_id, role) VALUES (v_user_id, v_invite.role) ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE invite_links
  SET use_count = use_count + 1,
      status = CASE WHEN use_count + 1 >= max_uses THEN 'accepted' ELSE status END,
      updated_at = NOW()
  WHERE id = v_invite.id;

  INSERT INTO invite_link_claims (invite_id, accepted_by_user_id) VALUES (v_invite.id, v_user_id);
  INSERT INTO invite_audit_events (invite_id, action, actor_user_id) VALUES (v_invite.id, 'accepted', v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'entityType', v_invite.entity_type,
    'entityId', v_invite.entity_id,
    'role', v_invite.role
  );
END;
$$;


ALTER FUNCTION "private"."claim_invite"("p_raw_token" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."claim_invite"("p_raw_token" "text") IS '@supabase-linter-ignore authenticated_security_definer_function_executable';



CREATE OR REPLACE FUNCTION "private"."create_checkout_transaction"("p_order" "jsonb", "p_tickets" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_ticket JSONB;
    v_item JSONB;
    v_calculated_subtotal INT := 0;
    v_calculated_discount INT := 0;
    v_tt_record RECORD;
    v_tt_price INT;
    v_promo RECORD;
    v_provided_total INT := (p_order->>'total_cents')::int;
    v_order_event_id TEXT := (p_order->>'event_id');
    v_buyer_email TEXT := (p_order->>'buyer_email');
    v_user_email TEXT;
BEGIN
    -- Authorization Check
    BEGIN
      v_user_email := auth.jwt()->>'email';
    EXCEPTION WHEN OTHERS THEN
      v_user_email := NULL;
    END;

    IF v_buyer_email != v_user_email THEN
      RAISE EXCEPTION 'Authorization error: buyer_email does not match authenticated user';
    END IF;

    -- Validate subtotal
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order->'items') LOOP
       SELECT * INTO v_tt_record FROM ticket_types WHERE id = (v_item->>'ticketTypeId') AND event_id = v_order_event_id;
       IF NOT FOUND THEN
         RAISE EXCEPTION 'Invalid ticket type %', v_item->>'ticketTypeId';
       END IF;
       
       IF v_tt_record.pricing->>'kind' = 'paid' THEN
         v_tt_price := (v_tt_record.pricing->>'priceInCents')::int;
       ELSE
         v_tt_price := 0;
       END IF;
       
       v_calculated_subtotal := v_calculated_subtotal + (v_tt_price * (v_item->>'quantity')::int);
    END LOOP;

    -- Validate discount
    IF (p_order->>'promo_code') IS NOT NULL AND (p_order->>'promo_code') != '' THEN
       SELECT * INTO v_promo FROM promo_codes WHERE code = (p_order->>'promo_code') AND event_id = v_order_event_id AND active = true;
       IF NOT FOUND THEN
         RAISE EXCEPTION 'Invalid promo code';
       END IF;
       
       IF v_promo.discount_kind = 'amount_off' THEN
         v_calculated_discount := v_promo.discount_value;
       ELSIF v_promo.discount_kind = 'percent_off' THEN
         v_calculated_discount := (v_calculated_subtotal * v_promo.discount_value / 100);
       ELSIF v_promo.discount_kind = 'free' THEN
         v_calculated_discount := v_calculated_subtotal;
       END IF;
    END IF;

    IF v_calculated_discount > v_calculated_subtotal THEN
       v_calculated_discount := v_calculated_subtotal;
    END IF;

    IF v_provided_total != (v_calculated_subtotal - v_calculated_discount) THEN
       RAISE EXCEPTION 'Price validation failed: provided total % does not match calculated total %', v_provided_total, (v_calculated_subtotal - v_calculated_discount);
    END IF;

    -- Insert Order
    INSERT INTO orders (
        id, event_id, buyer_email, items, subtotal_cents, discount_cents, total_cents, status
    ) VALUES (
        (p_order->>'id'),
        v_order_event_id,
        v_buyer_email,
        (p_order->'items'),
        v_calculated_subtotal,
        v_calculated_discount,
        v_provided_total,
        (p_order->>'status')
    );

    -- Insert Tickets
    FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_tickets)
    LOOP
        IF (v_ticket->>'owner_id') IS NOT NULL AND (v_ticket->>'owner_id')::uuid != auth.uid() THEN
            RAISE EXCEPTION 'Authorization error: ticket owner_id does not match authenticated user';
        END IF;

        INSERT INTO tickets (
            id, event_id, ticket_type_id, order_id, personalization,
            buyer_email, status, price_paid_cents, owner_id
        ) VALUES (
            (v_ticket->>'id'),
            (v_ticket->>'event_id'),
            (v_ticket->>'ticket_type_id'),
            (v_ticket->>'order_id'),
            (v_ticket->'personalization'),
            (v_ticket->>'buyer_email'),
            (v_ticket->>'status'),
            (v_ticket->>'price_paid_cents')::int,
            (v_ticket->>'owner_id')::uuid
        );
    END LOOP;
END;
$$;


ALTER FUNCTION "private"."create_checkout_transaction"("p_order" "jsonb", "p_tickets" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."create_checkout_transaction"("p_order" "jsonb", "p_tickets" "jsonb") IS '@supabase-linter-ignore authenticated_security_definer_function_executable';



CREATE OR REPLACE FUNCTION "private"."generate_ticket_hmac"("p_event_id" "text", "p_ticket_id" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_secret TEXT;
  v_payload TEXT;
  v_hmac BYTEA;
  v_hmac_base64 TEXT;
BEGIN
  BEGIN
    v_secret := current_setting('app.settings.qr_secret', true);
  EXCEPTION WHEN OTHERS THEN
    v_secret := NULL;
  END;

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'QR signing secret is not configured in postgres current_setting(app.settings.qr_secret)';
  END IF;

  v_payload := 'TF1.' || p_event_id || '.' || p_ticket_id;
  v_hmac := hmac(v_payload::bytea, v_secret::bytea, 'sha256');
  
  v_hmac_base64 := encode(v_hmac, 'base64');
  v_hmac_base64 := replace(replace(replace(v_hmac_base64, '+', '-'), '/', '_'), '=', '');

  RETURN v_payload || '.' || v_hmac_base64;
END;
$$;


ALTER FUNCTION "private"."generate_ticket_hmac"("p_event_id" "text", "p_ticket_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."generate_ticket_hmac"("p_event_id" "text", "p_ticket_id" "text") IS '@supabase-linter-ignore authenticated_security_definer_function_executable';



CREATE OR REPLACE FUNCTION "private"."get_artist_analytics"("artist_id_param" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "private"."get_artist_analytics"("artist_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."increment_promo_usage"("p_code" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  UPDATE promo_codes
  SET used_count = used_count + 1
  WHERE code = p_code
    AND active = TRUE
    AND (max_uses IS NULL OR used_count < max_uses)
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'promo_code_exhausted_or_invalid';
  END IF;
END;
$$;


ALTER FUNCTION "private"."increment_promo_usage"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."is_superadmin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  );
END;
$$;


ALTER FUNCTION "private"."is_superadmin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."promote_admin_by_email"("target_email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  target_user_id UUID;
  caller_role TEXT;
BEGIN
  -- 1. Check if the caller is a superadmin
  SELECT role INTO caller_role FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin';
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'Only superadmins can promote users.';
  END IF;

  -- 2. Find the user by email
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email LIMIT 1;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found.', target_email;
  END IF;

  -- 3. Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id);
END;
$$;


ALTER FUNCTION "private"."promote_admin_by_email"("target_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."revoke_invite"("p_invite_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','superadmin')) 
     AND NOT EXISTS (SELECT 1 FROM invite_links WHERE id = p_invite_id AND created_by_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Insufficient permissions to revoke this invite';
  END IF;

  UPDATE invite_links
  SET status = 'revoked', revoked_at = NOW(), revoked_by_user_id = auth.uid(), updated_at = NOW()
  WHERE id = p_invite_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or not in pending status';
  END IF;

  INSERT INTO invite_audit_events (invite_id, action, actor_user_id) VALUES (p_invite_id, 'revoked', auth.uid());
END;
$$;


ALTER FUNCTION "private"."revoke_invite"("p_invite_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."revoke_invite"("p_invite_id" "uuid") IS '@supabase-linter-ignore authenticated_security_definer_function_executable';



CREATE OR REPLACE FUNCTION "private"."validate_ticket"("p_ticket_id" "text", "p_scan_account_id" "text", "p_session_token" "text", "p_scanned_at" timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "private"."validate_ticket"("p_ticket_id" "text", "p_scan_account_id" "text", "p_session_token" "text", "p_scanned_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN private.buy_resale_ticket(p_listing_id, p_buyer_id);
END;
$$;


ALTER FUNCTION "public"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_ticket_resellable"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    v_price_paid INT;
BEGIN
    SELECT price_paid_cents INTO v_price_paid FROM public.tickets WHERE id = NEW.ticket_id;
    
    IF v_price_paid <= 0 THEN
        RAISE EXCEPTION 'Complimentary tickets cannot be listed for resale.';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_ticket_resellable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_invite"("p_raw_token" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_token_hash TEXT;
  v_invite invite_links%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'claim_invite requires an authenticated session';
  END IF;

  v_token_hash := encode(digest(p_raw_token, 'sha256'), 'hex');

  SELECT * INTO v_invite FROM invite_links WHERE token_hash = v_token_hash FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_invite.status NOT IN ('pending') OR v_invite.use_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_claimable', 'status', v_invite.status);
  END IF;

  IF v_invite.expires_at < NOW() THEN
    UPDATE invite_links SET status = 'expired', updated_at = NOW() WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;

  IF EXISTS (SELECT 1 FROM invite_link_claims WHERE invite_id = v_invite.id AND accepted_by_user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  IF v_invite.entity_type = 'organizer' THEN
    UPDATE public.organizers SET claimed_by_user_id = v_user_id WHERE id = v_invite.entity_id::UUID;
  ELSIF v_invite.entity_type = 'artist' THEN
    INSERT INTO public.artist_members (artist_id, user_id, role)
    VALUES (v_invite.entity_id::UUID, v_user_id, 'member')
    ON CONFLICT (artist_id, user_id) DO NOTHING;
  ELSIF v_invite.entity_type = 'venue' THEN
    UPDATE public.venues SET claimed_by_user_id = v_user_id WHERE id = v_invite.entity_id::UUID;
  END IF;

  INSERT INTO user_roles (user_id, role) VALUES (v_user_id, v_invite.role) ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE invite_links
  SET use_count = use_count + 1,
      status = CASE WHEN use_count + 1 >= max_uses THEN 'accepted' ELSE status END,
      updated_at = NOW()
  WHERE id = v_invite.id;

  INSERT INTO invite_link_claims (invite_id, accepted_by_user_id) VALUES (v_invite.id, v_user_id);
  INSERT INTO invite_audit_events (invite_id, action, actor_user_id) VALUES (v_invite.id, 'accepted', v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'entityType', v_invite.entity_type,
    'entityId', v_invite.entity_id,
    'role', v_invite.role
  );
END;
$$;


ALTER FUNCTION "public"."claim_invite"("p_raw_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_promos"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  UPDATE promo_codes
  SET active = false
  WHERE expires_at IS NOT NULL AND expires_at < NOW() AND active = true;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_promos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_checkout_transaction"("p_order" "jsonb", "p_tickets" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    PERFORM private.create_checkout_transaction(p_order, p_tickets);
END;
$$;


ALTER FUNCTION "public"."create_checkout_transaction"("p_order" "jsonb", "p_tickets" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_tickets_transaction"("p_tickets" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    v_ticket JSONB;
BEGIN
    FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_tickets)
    LOOP
        INSERT INTO public.tickets (
            id, event_id, ticket_type_id, order_id, personalization,
            buyer_email, issued_at, valid_from, valid_until, status, price_paid_cents, owner_id
        ) VALUES (
            (v_ticket->>'id'),
            (v_ticket->>'eventId'),
            (v_ticket->>'ticketTypeId'),
            (v_ticket->>'orderId'),
            (v_ticket->'personalization'),
            (v_ticket->>'buyerEmail'),
            (v_ticket->>'issuedAt')::timestamp,
            (v_ticket->>'validFrom')::timestamp,
            (v_ticket->>'validUntil')::timestamp,
            (v_ticket->>'status'),
            (v_ticket->>'pricePaidCents')::int,
            (v_ticket->>'owner_id')::uuid
        );
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."create_tickets_transaction"("p_tickets" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_ticket_hmac"("p_event_id" "text", "p_ticket_id" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN private.generate_ticket_hmac(p_event_id, p_ticket_id);
END;
$$;


ALTER FUNCTION "public"."generate_ticket_hmac"("p_event_id" "text", "p_ticket_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_artist_analytics"("artist_id_param" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN private.get_artist_analytics(artist_id_param);
END;
$$;


ALTER FUNCTION "public"."get_artist_analytics"("artist_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_promo_usage"("p_code" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    PERFORM private.increment_promo_usage(p_code);
END;
$$;


ALTER FUNCTION "public"."increment_promo_usage"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."issue_tickets_if_not_issued"("p_paypal_order_id" "text", "p_capture_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_order_id UUID;
BEGIN
    -- 1. Check if already captured
    IF EXISTS (SELECT 1 FROM orders WHERE paypal_capture_id = p_capture_id) THEN
        RETURN;
    END IF;

    -- 2. Update order status
    UPDATE orders 
    SET status = 'paid', paypal_capture_id = p_capture_id
    WHERE paypal_order_id = p_paypal_order_id
    RETURNING id INTO v_order_id;

    -- 3. You would trigger ticket issuance logic here or handle via application code
END;
$$;


ALTER FUNCTION "public"."issue_tickets_if_not_issued"("p_paypal_order_id" "text", "p_capture_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_resale_phase_shifts"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    listing RECORD;
    v_event RECORD;
    v_hours_until REAL;
BEGIN
    -- Loop through all active non-sold resale listings
    FOR listing IN 
        SELECT rl.*, t.event_id 
        FROM public.resale_listings rl
        JOIN public.tickets t ON rl.ticket_id = t.id
        WHERE rl.status IN ('listed', 'offered')
    LOOP
        -- Get event info
        SELECT starts_at, open_market_threshold_hours INTO v_event FROM public.events WHERE id = listing.event_id;
        
        v_hours_until := EXTRACT(EPOCH FROM (v_event.starts_at - NOW())) / 3600.0;
        
        IF v_hours_until <= v_event.open_market_threshold_hours THEN
            -- Phase 2: Liquidity Mode (Open Market)
            IF listing.status != 'open_market' THEN
                UPDATE public.resale_listings 
                SET status = 'open_market', offered_to_user_id = NULL, expires_at = NULL 
                WHERE id = listing.id;
                
                -- Here we would trigger an edge function via webhook to blast SMS
            END IF;
        ELSE
            -- Phase 1: Fairness Mode
            IF listing.status = 'offered' AND listing.expires_at < NOW() THEN
                -- Offer expired, pass to next waitlist user
                -- Find next waitlist user (simplified logic assuming we have a waitlist table, or just revert to 'listed' for edge function to pick up)
                UPDATE public.resale_listings 
                SET status = 'listed', offered_to_user_id = NULL, expires_at = NULL 
                WHERE id = listing.id;
            END IF;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."process_resale_phase_shifts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."promote_admin_by_email"("target_email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN private.promote_admin_by_email(target_email);
END;
$$;


ALTER FUNCTION "public"."promote_admin_by_email"("target_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_invite"("p_invite_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','superadmin')) 
     AND NOT EXISTS (SELECT 1 FROM invite_links WHERE id = p_invite_id AND created_by_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Insufficient permissions to revoke this invite';
  END IF;

  UPDATE invite_links
  SET status = 'revoked', revoked_at = NOW(), revoked_by_user_id = auth.uid(), updated_at = NOW()
  WHERE id = p_invite_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or not in pending status';
  END IF;

  INSERT INTO invite_audit_events (invite_id, action, actor_user_id) VALUES (p_invite_id, 'revoked', auth.uid());
END;
$$;


ALTER FUNCTION "public"."revoke_invite"("p_invite_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_enforce_price_cap"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_original_price INTEGER;
BEGIN
    SELECT price_paid_cents INTO v_original_price
    FROM tickets
    WHERE id = NEW.ticket_id;

    IF NEW.asking_price_cents > (v_original_price * 1.10) THEN
        RAISE EXCEPTION 'resale_price_cap_exceeded';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_enforce_price_cap"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_set_ticket_qr_payload"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF NEW.qr_payload IS NULL THEN
    NEW.qr_payload := generate_ticket_hmac(NEW.event_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_set_ticket_qr_payload"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_support_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- We assume the Edge Function is deployed to the Supabase project
  -- In local development or remote, net.http_post can be used via pg_net
  -- First, ensure the pg_net extension is enabled (already default in Supabase)
  
  -- Use pg_net to invoke the edge function asynchronously
  perform net.http_post(
      url := coalesce(
          current_setting('app.settings.edge_function_base_url', true),
          'http://127.0.0.1:54321/functions/v1' -- fallback for local
      ) || '/send-support-email',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_support_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ticket_type_sold_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.ticket_types
        SET sold_count = sold_count + 1
        WHERE id = NEW.ticket_type_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.ticket_types
        SET sold_count = sold_count - 1
        WHERE id = OLD.ticket_type_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_ticket_type_sold_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_invite"("p_token_hash" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_invite invite_links%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM invite_links WHERE token_hash = p_token_hash;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF v_invite.expires_at < NOW() AND v_invite.status = 'pending' THEN
    UPDATE invite_links SET status = 'expired', updated_at = NOW() WHERE id = v_invite.id;
    INSERT INTO invite_audit_events (invite_id, action) VALUES (v_invite.id, 'expired');
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  IF v_invite.status = 'revoked' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
  END IF;

  IF v_invite.status = 'accepted' OR v_invite.use_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'exhausted');
  END IF;

  IF v_invite.status = 'expired' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  INSERT INTO invite_audit_events (invite_id, action, actor_user_id) VALUES (v_invite.id, 'viewed', auth.uid());

  RETURN jsonb_build_object(
    'valid', true,
    'entityType', v_invite.entity_type,
    'entityName', v_invite.entity_name,
    'entityId', v_invite.entity_id,
    'inviteeEmail', v_invite.invitee_email,
    'prefill', v_invite.prefill,
    'expiresAt', v_invite.expires_at,
    'usesRemaining', v_invite.max_uses - v_invite.use_count
  );
END;
$$;


ALTER FUNCTION "public"."validate_invite"("p_token_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_ticket"("p_ticket_id" "text", "p_scan_account_id" "text", "p_session_token" "text", "p_scanned_at" timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN private.validate_ticket(p_ticket_id, p_scan_account_id, p_session_token, p_scanned_at);
END;
$$;


ALTER FUNCTION "public"."validate_ticket"("p_ticket_id" "text", "p_scan_account_id" "text", "p_session_token" "text", "p_scanned_at" timestamp with time zone) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."artist_members" (
    "artist_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."artist_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "bio" "text",
    "image_url" "text",
    "spotify_url" "text",
    "instagram_url" "text",
    "soundcloud_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "claimed_by_user_id" "uuid",
    "is_verified" boolean DEFAULT false
);


ALTER TABLE "public"."artists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blogs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "text" NOT NULL,
    "excerpt" "text",
    "cover_image_url" "text",
    "published" boolean DEFAULT false,
    "author_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blogs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_id" "uuid",
    "user_id" "uuid",
    "proof_url" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "entity_type" "text" DEFAULT 'artist'::"text" NOT NULL,
    "rejection_reason" "text",
    CONSTRAINT "entity_claims_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['artist'::"text", 'venue'::"text", 'organizer'::"text", 'artists'::"text", 'venues'::"text", 'organizers'::"text"]))),
    CONSTRAINT "entity_claims_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'awaiting_proof'::"text", 'proof_submitted'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."entity_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_followers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "entity_followers_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['artist'::"text", 'venue'::"text", 'organizer'::"text"])))
);


ALTER TABLE "public"."entity_followers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_artists" (
    "event_id" "text" NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "performance_time" timestamp with time zone,
    "stage_name" "text"
);


ALTER TABLE "public"."event_artists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_checkout_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "text" NOT NULL,
    "field_type" "text" NOT NULL,
    "label" "text" NOT NULL,
    "is_required" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_checkout_fields_field_type_check" CHECK (("field_type" = ANY (ARRAY['TEXT'::"text", 'EMAIL'::"text", 'PHONE'::"text", 'AGE'::"text", 'COUNTRY'::"text", 'ZIP'::"text"])))
);


ALTER TABLE "public"."event_checkout_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "organizer_name" "text" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "timezone_id" "text" NOT NULL,
    "organizer_id" "uuid",
    "description" "text",
    "venue" "text",
    "published" boolean DEFAULT false,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "theme_customization" "jsonb" DEFAULT '{}'::"jsonb",
    "country" "text",
    "city" "text",
    "is_external" boolean DEFAULT false,
    "external_ticket_url" "text",
    "approval_status" "text" DEFAULT 'pending'::"text",
    "reviewed_by" "uuid",
    "venue_id" "uuid",
    "category" "text" DEFAULT 'other'::"text",
    "open_market_threshold_hours" integer DEFAULT 168 NOT NULL,
    "latitude" double precision,
    "longitude" double precision,
    CONSTRAINT "events_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "events_category_check" CHECK (("category" = ANY (ARRAY['clubnight'::"text", 'concert'::"text", 'festival'::"text", 'workshop'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invite_audit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invite_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "actor_user_id" "uuid",
    "actor_ip" "inet",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb",
    CONSTRAINT "invite_audit_events_action_check" CHECK (("action" = ANY (ARRAY['created'::"text", 'viewed'::"text", 'accepted'::"text", 'revoked'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."invite_audit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invite_link_claims" (
    "invite_id" "uuid" NOT NULL,
    "accepted_by_user_id" "uuid" NOT NULL,
    "claimed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invite_link_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invite_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "token_hash" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "entity_name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "invitee_email" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "max_uses" integer DEFAULT 1 NOT NULL,
    "use_count" integer DEFAULT 0 NOT NULL,
    "prefill" "jsonb",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '72:00:00'::interval) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    "revoked_by_user_id" "uuid",
    CONSTRAINT "invite_links_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['organizer'::"text", 'artist'::"text", 'venue'::"text"]))),
    CONSTRAINT "invite_links_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'revoked'::"text", 'expired'::"text"]))),
    CONSTRAINT "invite_use_count_check" CHECK (("use_count" <= "max_uses"))
);


ALTER TABLE "public"."invite_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "text" NOT NULL,
    "event_id" "text" NOT NULL,
    "items" "jsonb" NOT NULL,
    "buyer_email" "text" NOT NULL,
    "promo_code" "text",
    "subtotal_cents" integer NOT NULL,
    "discount_cents" integer NOT NULL,
    "total_cents" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "paypal_order_id" "text",
    "paypal_capture_id" "text",
    "payment_provider" "text" DEFAULT 'stripe'::"text"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "stripe_account_id" "text",
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "subscription_tier" "text" DEFAULT 'free'::"text",
    "bio" "text",
    "image_url" "text",
    "claimed_by_user_id" "uuid",
    "marketing_pixels" "jsonb" DEFAULT '{}'::"jsonb",
    "paypal_merchant_id" "text",
    "paypal_onboarded" boolean DEFAULT false
);


ALTER TABLE "public"."organizers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "text",
    "organizer_id" "uuid",
    "visitor_id" "text",
    "referrer" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."page_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_batches" (
    "id" "uuid" NOT NULL,
    "event_id" "text" NOT NULL,
    "config" "jsonb" NOT NULL,
    "codes" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."promo_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "discount_kind" "text" NOT NULL,
    "discount_value" integer,
    "applies_to" "text"[],
    "max_uses" integer,
    "used_count" integer DEFAULT 0 NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "batch_id" "uuid",
    "batch_name" "text",
    CONSTRAINT "promo_codes_discount_kind_check" CHECK (("discount_kind" = ANY (ARRAY['percent_off'::"text", 'amount_off'::"text", 'free'::"text"])))
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resale_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "text" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "asking_price_cents" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'listed'::"text",
    "offered_to_user_id" "uuid",
    "expires_at" timestamp with time zone,
    CONSTRAINT "resale_listings_status_check" CHECK (("status" = ANY (ARRAY['listed'::"text", 'offered'::"text", 'open_market'::"text", 'sold'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."resale_listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scan_accounts" (
    "id" "text" NOT NULL,
    "event_id" "text" NOT NULL,
    "username" "text" NOT NULL,
    "pin_hash" "text" NOT NULL,
    "pin_salt" "text" NOT NULL,
    "credential_version" integer DEFAULT 1 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by_admin" boolean DEFAULT true NOT NULL,
    "assigned_location" "text",
    "last_login_at" timestamp with time zone
);


ALTER TABLE "public"."scan_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scan_events" (
    "id" "text" NOT NULL,
    "ticket_id" "text" NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"(),
    "scanned_by_account_id" "text" NOT NULL,
    "scanned_by_account_name" "text" NOT NULL,
    "result" "text" NOT NULL,
    "payload" "text",
    "clock_skew_seconds" integer,
    "location" "text"
);


ALTER TABLE "public"."scan_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_ticket_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "sender_id" "uuid",
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."support_ticket_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text",
    "assigned_admin_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_types" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "pricing" "jsonb" NOT NULL,
    "capacity" integer,
    "max_per_order" integer,
    "sale_start_date" timestamp with time zone,
    "sale_end_date" timestamp with time zone,
    "valid_from" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "transferable" boolean DEFAULT true NOT NULL,
    "visible" boolean DEFAULT true NOT NULL,
    "archived" boolean DEFAULT false NOT NULL,
    "event_id" "text" NOT NULL,
    "sold_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."ticket_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "text" NOT NULL,
    "event_id" "text" NOT NULL,
    "ticket_type_id" "text" NOT NULL,
    "order_id" "text" NOT NULL,
    "personalization" "jsonb" NOT NULL,
    "buyer_email" "text" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "valid_from" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "status" "text" DEFAULT 'pending_delivery'::"text" NOT NULL,
    "qr_payload" "text",
    "price_paid_cents" integer NOT NULL,
    "transfer_history" "jsonb" DEFAULT '[]'::"jsonb",
    "owner_id" "uuid"
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timezones" (
    "id" "text" NOT NULL,
    "label" "text" NOT NULL,
    "iana_zone" "text" NOT NULL
);


ALTER TABLE "public"."timezones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['fan'::"text", 'organizer'::"text", 'admin'::"text", 'superadmin'::"text", 'artist_member'::"text", 'venue_manager'::"text", 'writer'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "city" "text",
    "country" "text",
    "capacity" integer,
    "bio" "text",
    "image_url" "text",
    "claimed_by_user_id" "uuid",
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "latitude" double precision,
    "longitude" double precision
);


ALTER TABLE "public"."venues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."writer_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pen_name" "text" NOT NULL,
    "bio" "text",
    "samples" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "writer_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."writer_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."writer_profiles" (
    "id" "uuid" NOT NULL,
    "pen_name" "text" NOT NULL,
    "bio" "text",
    "image_url" "text",
    "verified" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."writer_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."entity_claims"
    ADD CONSTRAINT "artist_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artist_members"
    ADD CONSTRAINT "artist_members_pkey" PRIMARY KEY ("artist_id", "user_id");



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."entity_followers"
    ADD CONSTRAINT "entity_followers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_artists"
    ADD CONSTRAINT "event_artists_pkey" PRIMARY KEY ("event_id", "artist_id");



ALTER TABLE ONLY "public"."event_checkout_fields"
    ADD CONSTRAINT "event_checkout_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invite_audit_events"
    ADD CONSTRAINT "invite_audit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invite_link_claims"
    ADD CONSTRAINT "invite_link_claims_pkey" PRIMARY KEY ("invite_id", "accepted_by_user_id");



ALTER TABLE ONLY "public"."invite_links"
    ADD CONSTRAINT "invite_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invite_links"
    ADD CONSTRAINT "invite_links_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_paypal_capture_id_key" UNIQUE ("paypal_capture_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_paypal_order_id_key" UNIQUE ("paypal_order_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizers"
    ADD CONSTRAINT "organizer_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page_views"
    ADD CONSTRAINT "page_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_batches"
    ADD CONSTRAINT "promo_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_event_code_unique" UNIQUE ("event_id", "code");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resale_listings"
    ADD CONSTRAINT "resale_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resale_listings"
    ADD CONSTRAINT "resale_listings_ticket_id_key" UNIQUE ("ticket_id");



ALTER TABLE ONLY "public"."scan_accounts"
    ADD CONSTRAINT "scan_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scan_events"
    ADD CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timezones"
    ADD CONSTRAINT "timezones_label_key" UNIQUE ("label");



ALTER TABLE ONLY "public"."timezones"
    ADD CONSTRAINT "timezones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."writer_applications"
    ADD CONSTRAINT "writer_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."writer_profiles"
    ADD CONSTRAINT "writer_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_entity_followers_count" ON "public"."entity_followers" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_entity_followers_lookup" ON "public"."entity_followers" USING "btree" ("entity_id", "entity_type");



CREATE INDEX "idx_page_views_event_id" ON "public"."page_views" USING "btree" ("event_id");



CREATE INDEX "idx_page_views_organizer_id" ON "public"."page_views" USING "btree" ("organizer_id");



CREATE INDEX "idx_scan_accounts_event_id" ON "public"."scan_accounts" USING "btree" ("event_id");



CREATE INDEX "idx_scan_events_ticket_id" ON "public"."scan_events" USING "btree" ("ticket_id");



CREATE INDEX "idx_tickets_ticket_type_id" ON "public"."tickets" USING "btree" ("ticket_type_id");



CREATE UNIQUE INDEX "idx_unique_follow" ON "public"."entity_followers" USING "btree" ("user_id", "entity_type", "entity_id");



CREATE INDEX "invite_audit_invite_idx" ON "public"."invite_audit_events" USING "btree" ("invite_id");



CREATE INDEX "invite_links_created_by_idx" ON "public"."invite_links" USING "btree" ("created_by_user_id");



CREATE INDEX "invite_links_entity_idx" ON "public"."invite_links" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "invite_links_status_idx" ON "public"."invite_links" USING "btree" ("status");



CREATE INDEX "invite_links_token_hash_idx" ON "public"."invite_links" USING "btree" ("token_hash");



CREATE OR REPLACE TRIGGER "ensure_ticket_resellable" BEFORE INSERT ON "public"."resale_listings" FOR EACH ROW EXECUTE FUNCTION "public"."check_ticket_resellable"();



CREATE OR REPLACE TRIGGER "maintain_ticket_type_sold_count" AFTER INSERT OR DELETE OR UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_ticket_type_sold_count"();



CREATE OR REPLACE TRIGGER "on_support_ticket_created" AFTER INSERT ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_support_email"();



CREATE OR REPLACE TRIGGER "trg_update_ticket_type_sold_count" AFTER INSERT OR DELETE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_ticket_type_sold_count"();



CREATE OR REPLACE TRIGGER "trigger_enforce_price_cap" BEFORE INSERT OR UPDATE ON "public"."resale_listings" FOR EACH ROW EXECUTE FUNCTION "public"."trg_enforce_price_cap"();



CREATE OR REPLACE TRIGGER "trigger_set_ticket_qr_payload" BEFORE INSERT ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_ticket_qr_payload"();



ALTER TABLE ONLY "public"."entity_claims"
    ADD CONSTRAINT "artist_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_members"
    ADD CONSTRAINT "artist_members_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_members"
    ADD CONSTRAINT "artist_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."organizers"("id");



ALTER TABLE ONLY "public"."entity_followers"
    ADD CONSTRAINT "entity_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."event_artists"
    ADD CONSTRAINT "event_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_artists"
    ADD CONSTRAINT "event_artists_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_checkout_fields"
    ADD CONSTRAINT "event_checkout_fields_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizers"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_timezone_id_fkey" FOREIGN KEY ("timezone_id") REFERENCES "public"."timezones"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."invite_audit_events"
    ADD CONSTRAINT "invite_audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invite_audit_events"
    ADD CONSTRAINT "invite_audit_events_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "public"."invite_links"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invite_link_claims"
    ADD CONSTRAINT "invite_link_claims_accepted_by_user_id_fkey" FOREIGN KEY ("accepted_by_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invite_link_claims"
    ADD CONSTRAINT "invite_link_claims_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "public"."invite_links"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invite_links"
    ADD CONSTRAINT "invite_links_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invite_links"
    ADD CONSTRAINT "invite_links_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizers"
    ADD CONSTRAINT "organizers_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."page_views"
    ADD CONSTRAINT "page_views_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."page_views"
    ADD CONSTRAINT "page_views_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizers"("id");



ALTER TABLE ONLY "public"."promo_batches"
    ADD CONSTRAINT "promo_batches_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resale_listings"
    ADD CONSTRAINT "resale_listings_offered_to_user_id_fkey" FOREIGN KEY ("offered_to_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."resale_listings"
    ADD CONSTRAINT "resale_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."resale_listings"
    ADD CONSTRAINT "resale_listings_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id");



ALTER TABLE ONLY "public"."scan_accounts"
    ADD CONSTRAINT "scan_accounts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scan_events"
    ADD CONSTRAINT "scan_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."writer_applications"
    ADD CONSTRAINT "writer_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."writer_profiles"
    ADD CONSTRAINT "writer_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all events" ON "public"."events" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can update claims" ON "public"."entity_claims" FOR UPDATE USING (("private"."is_superadmin"() OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text"))))));



CREATE POLICY "Admins can view all claims" ON "public"."entity_claims" FOR SELECT USING (("private"."is_superadmin"() OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text"))))));



CREATE POLICY "Admins manage applications" ON "public"."writer_applications" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins manage tickets" ON "public"."support_tickets" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Anyone can create tickets" ON "public"."support_tickets" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "Anyone can insert page views" ON "public"."page_views" FOR INSERT WITH CHECK (("auth"."role"() = ANY (ARRAY['anon'::"text", 'authenticated'::"text"])));



CREATE POLICY "Anyone can read follows" ON "public"."entity_followers" FOR SELECT USING (true);



CREATE POLICY "Artists manage their own profiles" ON "public"."artists" USING ((("auth"."uid"() = "claimed_by_user_id") AND ("is_verified" = true)));



CREATE POLICY "Authenticated users can read roles" ON "public"."user_roles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authors manage their blogs" ON "public"."blogs" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Checkout fields are viewable by everyone" ON "public"."event_checkout_fields" FOR SELECT USING (true);



CREATE POLICY "Fans insert own tickets" ON "public"."tickets" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Fans view own tickets" ON "public"."tickets" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Followers can view their own follows" ON "public"."entity_followers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Organizers can manage checkout fields" ON "public"."event_checkout_fields" USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_checkout_fields"."event_id") AND ("events"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "Organizers can view own page views" ON "public"."page_views" FOR SELECT USING (("organizer_id" = "auth"."uid"()));



CREATE POLICY "Organizers can view scan events" ON "public"."scan_events" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM ("public"."tickets" "t"
     JOIN "public"."events" "e" ON (("t"."event_id" = "e"."id")))
  WHERE (("scan_events"."ticket_id" = "t"."id") AND ("e"."organizer_id" = "auth"."uid"())))) OR ("scanned_by_account_id" = ("auth"."uid"())::"text")));



CREATE POLICY "Organizers manage event artists" ON "public"."event_artists" USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_artists"."event_id") AND ("events"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "Organizers manage own events" ON "public"."events" USING ((EXISTS ( SELECT 1
   FROM "public"."organizers"
  WHERE (("organizers"."id" = "events"."organizer_id") AND ("organizers"."claimed_by_user_id" = "auth"."uid"())))));



CREATE POLICY "Organizers manage own profile" ON "public"."organizers" USING (("claimed_by_user_id" = "auth"."uid"()));



CREATE POLICY "Organizers manage own ticket types" ON "public"."ticket_types" USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "ticket_types"."event_id") AND ("events"."organizer_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "ticket_types"."event_id") AND ("events"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "Organizers manage scan accounts" ON "public"."scan_accounts" USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "scan_accounts"."event_id") AND ("events"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "Organizers manage their unclaimed artists" ON "public"."artists" USING ((("auth"."uid"() = "created_by") AND ("claimed_by_user_id" IS NULL)));



CREATE POLICY "Organizers view tickets for their events" ON "public"."tickets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "tickets"."event_id") AND ("events"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "Public can view artists" ON "public"."artists" FOR SELECT USING (true);



CREATE POLICY "Public can view event artists" ON "public"."event_artists" FOR SELECT USING (true);



CREATE POLICY "Public can view published blogs" ON "public"."blogs" FOR SELECT USING (("published" = true));



CREATE POLICY "Public read events" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Public read organizers" ON "public"."organizers" FOR SELECT USING (true);



CREATE POLICY "Public read ticket_types" ON "public"."ticket_types" FOR SELECT USING (true);



CREATE POLICY "Public read venues" ON "public"."venues" FOR SELECT USING (true);



CREATE POLICY "Public read writer_profiles" ON "public"."writer_profiles" FOR SELECT USING (true);



CREATE POLICY "Public view tickets for active resale" ON "public"."tickets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resale_listings"
  WHERE (("resale_listings"."ticket_id" = "tickets"."id") AND ("resale_listings"."is_active" = true)))));



CREATE POLICY "Public views active resales" ON "public"."resale_listings" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Sellers manage own listings" ON "public"."resale_listings" USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Superadmins can manage roles" ON "public"."user_roles" USING ("private"."is_superadmin"());



CREATE POLICY "Timezones are viewable by everyone" ON "public"."timezones" FOR SELECT USING (true);



CREATE POLICY "Users can create claims" ON "public"."entity_claims" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own orders" ON "public"."orders" FOR INSERT WITH CHECK (("buyer_email" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "Users can create scan events" ON "public"."scan_events" FOR INSERT WITH CHECK (("scanned_by_account_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can delete their own follows" ON "public"."entity_followers" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can follow entities" ON "public"."entity_followers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own follows" ON "public"."entity_followers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read/write ticket messages" ON "public"."support_ticket_messages" USING ((EXISTS ( SELECT 1
   FROM "public"."support_tickets"
  WHERE (("support_tickets"."id" = "support_ticket_messages"."ticket_id") AND (("support_tickets"."user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "user_roles"."user_id"
           FROM "public"."user_roles"
          WHERE ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"])))))))));



CREATE POLICY "Users can unfollow entities" ON "public"."entity_followers" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own claims" ON "public"."entity_claims" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own orders" ON "public"."orders" FOR SELECT USING (("buyer_email" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "Users can view own tickets" ON "public"."support_tickets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users insert own applications" ON "public"."writer_applications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view own applications" ON "public"."writer_applications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Venues manage own profile" ON "public"."venues" USING (("claimed_by_user_id" = "auth"."uid"()));



CREATE POLICY "Writers manage own profile" ON "public"."writer_profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "admins_create_invites" ON "public"."invite_links" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "admins_read_all_invites" ON "public"."invite_links" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "admins_read_artist_members" ON "public"."artist_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "admins_read_audit_events" ON "public"."invite_audit_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



ALTER TABLE "public"."artist_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "artist_members_read_own" ON "public"."artist_members" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blogs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_checkout_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invite_audit_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invite_link_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invite_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organizer_manage_promo_batches" ON "public"."promo_batches" USING (("event_id" IN ( SELECT "e"."id"
   FROM ("public"."events" "e"
     JOIN "public"."organizers" "op" ON (("op"."id" = "e"."organizer_id")))
  WHERE ("op"."claimed_by_user_id" = "auth"."uid"()))));



CREATE POLICY "organizer_manage_promo_codes" ON "public"."promo_codes" USING (("event_id" IN ( SELECT "e"."id"
   FROM ("public"."events" "e"
     JOIN "public"."organizers" "op" ON (("op"."id" = "e"."organizer_id")))
  WHERE ("op"."claimed_by_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."organizers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organizers_create_artist_invites" ON "public"."invite_links" FOR INSERT WITH CHECK ((("entity_type" = 'artist'::"text") AND ("created_by_user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."organizers"
  WHERE ("organizers"."claimed_by_user_id" = "auth"."uid"())))));



CREATE POLICY "organizers_read_own_invites" ON "public"."invite_links" FOR SELECT USING (("created_by_user_id" = "auth"."uid"()));



ALTER TABLE "public"."page_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_read_active_promo_codes" ON "public"."promo_codes" FOR SELECT USING (("active" = true));



ALTER TABLE "public"."resale_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scan_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scan_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timezones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venues" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venues_read_all" ON "public"."venues" FOR SELECT USING (true);



ALTER TABLE "public"."writer_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."writer_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "private" TO "anon";
GRANT USAGE ON SCHEMA "private" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































REVOKE ALL ON FUNCTION "private"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "private"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "private"."claim_invite"("p_raw_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."claim_invite"("p_raw_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "private"."claim_invite"("p_raw_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "private"."create_checkout_transaction"("p_order" "jsonb", "p_tickets" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."create_checkout_transaction"("p_order" "jsonb", "p_tickets" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "private"."create_checkout_transaction"("p_order" "jsonb", "p_tickets" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "private"."generate_ticket_hmac"("p_event_id" "text", "p_ticket_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."generate_ticket_hmac"("p_event_id" "text", "p_ticket_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "private"."generate_ticket_hmac"("p_event_id" "text", "p_ticket_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "private"."get_artist_analytics"("artist_id_param" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."get_artist_analytics"("artist_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "private"."get_artist_analytics"("artist_id_param" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "private"."increment_promo_usage"("p_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."increment_promo_usage"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "private"."increment_promo_usage"("p_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "private"."is_superadmin"() TO "anon";
GRANT ALL ON FUNCTION "private"."is_superadmin"() TO "authenticated";
GRANT ALL ON FUNCTION "private"."is_superadmin"() TO "service_role";



REVOKE ALL ON FUNCTION "private"."promote_admin_by_email"("target_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."promote_admin_by_email"("target_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "private"."promote_admin_by_email"("target_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "private"."revoke_invite"("p_invite_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."revoke_invite"("p_invite_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "private"."revoke_invite"("p_invite_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "private"."validate_ticket"("p_ticket_id" "text", "p_scan_account_id" "text", "p_session_token" "text", "p_scanned_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."validate_ticket"("p_ticket_id" "text", "p_scan_account_id" "text", "p_session_token" "text", "p_scanned_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "private"."validate_ticket"("p_ticket_id" "text", "p_scan_account_id" "text", "p_session_token" "text", "p_scanned_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_ticket_resellable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_ticket_resellable"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_invite"("p_raw_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_invite"("p_raw_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_invite"("p_raw_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_expired_promos"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_expired_promos"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_checkout_transaction"("p_order" "jsonb", "p_tickets" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_checkout_transaction"("p_order" "jsonb", "p_tickets" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_checkout_transaction"("p_order" "jsonb", "p_tickets" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_tickets_transaction"("p_tickets" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_tickets_transaction"("p_tickets" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_tickets_transaction"("p_tickets" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."generate_ticket_hmac"("p_event_id" "text", "p_ticket_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_ticket_hmac"("p_event_id" "text", "p_ticket_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_ticket_hmac"("p_event_id" "text", "p_ticket_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_artist_analytics"("artist_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_artist_analytics"("artist_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_artist_analytics"("artist_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_promo_usage"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_promo_usage"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_promo_usage"("p_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."issue_tickets_if_not_issued"("p_paypal_order_id" "text", "p_capture_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."issue_tickets_if_not_issued"("p_paypal_order_id" "text", "p_capture_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."issue_tickets_if_not_issued"("p_paypal_order_id" "text", "p_capture_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_resale_phase_shifts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_resale_phase_shifts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."promote_admin_by_email"("target_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."promote_admin_by_email"("target_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."promote_admin_by_email"("target_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."revoke_invite"("p_invite_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."revoke_invite"("p_invite_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_invite"("p_invite_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."trg_enforce_price_cap"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trg_enforce_price_cap"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."trg_set_ticket_qr_payload"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trg_set_ticket_qr_payload"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."trigger_support_email"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_support_email"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_ticket_type_sold_count"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_ticket_type_sold_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ticket_type_sold_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ticket_type_sold_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_invite"("p_token_hash" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_invite"("p_token_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_invite"("p_token_hash" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_ticket"("p_ticket_id" "text", "p_scan_account_id" "text", "p_session_token" "text", "p_scanned_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_ticket"("p_ticket_id" "text", "p_scan_account_id" "text", "p_session_token" "text", "p_scanned_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_ticket"("p_ticket_id" "text", "p_scan_account_id" "text", "p_session_token" "text", "p_scanned_at" timestamp with time zone) TO "service_role";
























GRANT ALL ON TABLE "public"."artist_members" TO "anon";
GRANT ALL ON TABLE "public"."artist_members" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_members" TO "service_role";



GRANT ALL ON TABLE "public"."artists" TO "anon";
GRANT ALL ON TABLE "public"."artists" TO "authenticated";
GRANT ALL ON TABLE "public"."artists" TO "service_role";



GRANT ALL ON TABLE "public"."blogs" TO "anon";
GRANT ALL ON TABLE "public"."blogs" TO "authenticated";
GRANT ALL ON TABLE "public"."blogs" TO "service_role";



GRANT ALL ON TABLE "public"."entity_claims" TO "anon";
GRANT ALL ON TABLE "public"."entity_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_claims" TO "service_role";



GRANT ALL ON TABLE "public"."entity_followers" TO "anon";
GRANT ALL ON TABLE "public"."entity_followers" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_followers" TO "service_role";



GRANT ALL ON TABLE "public"."event_artists" TO "anon";
GRANT ALL ON TABLE "public"."event_artists" TO "authenticated";
GRANT ALL ON TABLE "public"."event_artists" TO "service_role";



GRANT ALL ON TABLE "public"."event_checkout_fields" TO "anon";
GRANT ALL ON TABLE "public"."event_checkout_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."event_checkout_fields" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."invite_audit_events" TO "anon";
GRANT ALL ON TABLE "public"."invite_audit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."invite_audit_events" TO "service_role";



GRANT ALL ON TABLE "public"."invite_link_claims" TO "anon";
GRANT ALL ON TABLE "public"."invite_link_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."invite_link_claims" TO "service_role";



GRANT ALL ON TABLE "public"."invite_links" TO "anon";
GRANT ALL ON TABLE "public"."invite_links" TO "authenticated";
GRANT ALL ON TABLE "public"."invite_links" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."organizers" TO "anon";
GRANT ALL ON TABLE "public"."organizers" TO "authenticated";
GRANT ALL ON TABLE "public"."organizers" TO "service_role";



GRANT ALL ON TABLE "public"."page_views" TO "anon";
GRANT ALL ON TABLE "public"."page_views" TO "authenticated";
GRANT ALL ON TABLE "public"."page_views" TO "service_role";



GRANT ALL ON TABLE "public"."promo_batches" TO "anon";
GRANT ALL ON TABLE "public"."promo_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_batches" TO "service_role";



GRANT ALL ON TABLE "public"."promo_codes" TO "anon";
GRANT ALL ON TABLE "public"."promo_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";



GRANT ALL ON TABLE "public"."resale_listings" TO "anon";
GRANT ALL ON TABLE "public"."resale_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."resale_listings" TO "service_role";



GRANT ALL ON TABLE "public"."scan_accounts" TO "anon";
GRANT ALL ON TABLE "public"."scan_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."scan_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."scan_events" TO "anon";
GRANT ALL ON TABLE "public"."scan_events" TO "authenticated";
GRANT ALL ON TABLE "public"."scan_events" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_messages" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_types" TO "anon";
GRANT ALL ON TABLE "public"."ticket_types" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_types" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."timezones" TO "anon";
GRANT ALL ON TABLE "public"."timezones" TO "authenticated";
GRANT ALL ON TABLE "public"."timezones" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."venues" TO "anon";
GRANT ALL ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";



GRANT ALL ON TABLE "public"."writer_applications" TO "anon";
GRANT ALL ON TABLE "public"."writer_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."writer_applications" TO "service_role";



GRANT ALL ON TABLE "public"."writer_profiles" TO "anon";
GRANT ALL ON TABLE "public"."writer_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."writer_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































