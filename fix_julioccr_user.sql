
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'julioccr1609@gmail.com';
  v_password TEXT := 'Julioccr2020';
BEGIN
  -- 1. Verificar se o user existe na auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    -- Atualizar senha
    UPDATE auth.users 
    SET encrypted_password = crypt(v_password, gen_salt('bf'))
    WHERE id = v_user_id;
  ELSE
    -- Criar novo user se não existir (embora pareça que existe)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', v_email, 
      crypt(v_password, gen_salt('bf')), now(), 
      '{"provider": "email", "providers": ["email"]}', '{"name": "Julio User"}', 
      now(), now(), 'authenticated', 'authenticated'
    );
  END IF;

  -- 2. Garantir profile de ADMIN
  INSERT INTO public.profiles (id, name, email, role, job_title)
  VALUES (
    v_user_id, 
    'Julio Admin', 
    v_email, 
    'ADMIN', 
    'Administrador'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'ADMIN',
    email = EXCLUDED.email;
    
END $$;
