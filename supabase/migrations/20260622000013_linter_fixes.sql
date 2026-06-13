CREATE SCHEMA IF NOT EXISTS private;

-- 1. Fix buy_resale_ticket
-- Move to private schema as SECURITY DEFINER
CREATE OR REPLACE FUNCTION private.buy_resale_ticket(p_listing_id UUID, p_buyer_id UUID)
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

-- Create public wrapper as SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.buy_resale_ticket(p_listing_id UUID, p_buyer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    IF p_buyer_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot purchase ticket on behalf of another user';
    END IF;
    RETURN private.buy_resale_ticket(p_listing_id, p_buyer_id);
END;
$$;

-- 2. Fix promote_admin_by_email
-- Move to private schema as SECURITY DEFINER
CREATE OR REPLACE FUNCTION private.promote_admin_by_email(target_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin';
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'Only superadmins can promote users.';
  END IF;

  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email LIMIT 1;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found.', target_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id);
END;
$$;

-- Create public wrapper as SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.promote_admin_by_email(target_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN private.promote_admin_by_email(target_email);
END;
$$;
