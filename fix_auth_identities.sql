
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'julioccr1609@gmail.com';
BEGIN
  -- 1. Pega o ID do usuário (já criado anteriormente)
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
     -- 2. Inserir na auth.identities se não existir
     INSERT INTO auth.identities (
       id,
       user_id,
       provider_id,
       identity_data,
       provider,
       last_sign_in_at,
       created_at,
       updated_at,
       email
     ) VALUES (
       v_user_id, -- Geralmente o ID da identidade é o mesmo do provider_id ou um novo UUID se for email? Para email provider, costuma ser o próprio user_id ou um hash. Vamos usar user_id para simplificar ou gen_random_uuid()
       v_user_id,
       v_user_id::text, -- provider_id para email geralmente é o proprio user ID ou email
       jsonb_build_object('sub', v_user_id, 'email', v_email, 'email_verified', true),
       'email',
       now(),
       now(),
       now(),
       v_email
     ) ON CONFLICT (provider_id, provider) DO NOTHING;
     
     RAISE NOTICE 'Identidade criada/atualizada para %', v_email;
  ELSE
     RAISE NOTICE 'Usuário não encontrado %', v_email;
  END IF;
END $$;
