
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'julioccr1609@gmail.com';
BEGIN
  -- 1. Pega o ID do usuário (já criado anteriormente)
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
     -- 2. Inserir na auth.identities
     -- Nota: 'email' é coluna gerada, não inserimos.
     INSERT INTO auth.identities (
       id,
       user_id,
       provider_id,
       identity_data,
       provider,
       last_sign_in_at,
       created_at,
       updated_at
     ) VALUES (
       v_user_id, 
       v_user_id,
       v_user_id::text, 
       jsonb_build_object('sub', v_user_id, 'email', v_email, 'email_verified', true, 'provider_email', v_email),
       'email',
       now(),
       now(),
       now()
     ) ON CONFLICT (provider_id, provider) DO UPDATE SET
        identity_data = EXCLUDED.identity_data;
     
     RAISE NOTICE 'Identidade corrigida para %', v_email;
  ELSE
     RAISE NOTICE 'Usuário não encontrado %', v_email;
  END IF;
END $$;
