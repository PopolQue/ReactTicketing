DROP FUNCTION IF EXISTS public.buy_resale_ticket(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.promote_admin_by_email(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.buy_resale_ticket(p_listing_id UUID, p_buyer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ticket_id TEXT;
    v_seller_id UUID;
    v_is_active BOOLEAN;
BEGIN
    SELECT ticket_id, seller_id, is_active 
    INTO v_ticket_id, v_seller_id, v_is_active
    FROM resale_listings 
    WHERE id = p_listing_id 
    FOR UPDATE;

    IF NOT FOUND OR NOT v_is_active THEN
        RAISE EXCEPTION 'Listing is no longer active or does not exist';
    END IF;

    UPDATE resale_listings SET is_active = FALSE WHERE id = p_listing_id;
    UPDATE tickets SET owner_id = p_buyer_id WHERE id = v_ticket_id;

    RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.buy_resale_ticket(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.buy_resale_ticket(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.buy_resale_ticket(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.promote_admin_by_email(target_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  caller_role TEXT;
BEGIN
  -- 1. Check if the caller is a superadmin
  SELECT role INTO caller_role FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin';
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

REVOKE EXECUTE ON FUNCTION public.promote_admin_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.promote_admin_by_email(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.promote_admin_by_email(TEXT) TO authenticated;

DROP FUNCTION IF EXISTS private.buy_resale_ticket(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS private.promote_admin_by_email(TEXT) CASCADE;
DROP SCHEMA IF EXISTS private CASCADE;
