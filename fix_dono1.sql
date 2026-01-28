DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Get User ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dono1@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User dono1@gmail.com not found';
  END IF;

  -- Create Org
  INSERT INTO public.organizations (name, slug, owner_id, subscription_status)
  VALUES ('Barbearia Dono1', 'barbearia-dono1', v_user_id, 'active')
  ON CONFLICT (slug) DO UPDATE SET owner_id = v_user_id
  RETURNING id INTO v_org_id;

  -- Upsert Profile
  INSERT INTO public.profiles (id, name, email, role, job_title, avatar_url, organization_id)
  VALUES (
    v_user_id,
    'Dono Teste',
    'dono1@gmail.com',
    'ADMIN',
    'Owner',
    'https://github.com/shadcn.png',
    v_org_id
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'ADMIN',
    organization_id = v_org_id;

END $$;
