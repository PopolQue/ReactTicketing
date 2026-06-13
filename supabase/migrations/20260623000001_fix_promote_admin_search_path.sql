-- supabase-lint-ignore authenticated_security_definer_function_executable
CREATE OR REPLACE FUNCTION public.promote_admin_by_email(target_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
