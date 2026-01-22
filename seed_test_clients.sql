
DO $$
DECLARE
  i INT;
  new_id UUID;
  user_email TEXT;
BEGIN
  -- Cria os 15 clientes de teste
  FOR i IN 1..15 LOOP
    -- Gera um UUID novo para cada iteração (se gen_random_uuid() não estiver disponível, o Supabase geralmente tem uuid_generate_v4())
    -- Vamos tentar usar gen_random_uuid() que é nativo do Postgres mais novo, ou fallback se der erro.
    -- Mas para simplicidade, vamos assumir gen_random_uuid() já que é padrao no Supabase.
    
    user_email := 'cliente_teste_' || i || '@barberpro.com';

    -- Verifica se já existe para nao duplicar erro
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        new_id := gen_random_uuid();
        
        -- Inserir em auth.users
        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at,
          role,
          aud
        )
        VALUES (
          new_id,
          '00000000-0000-0000-0000-000000000000',
          user_email,
          crypt('password123', gen_salt('bf')), -- Senha padrão para todos
          now(),
          '{"provider": "email", "providers": ["email"]}',
          jsonb_build_object('name', 'Cliente Teste ' || i),
          now(),
          now(),
          'authenticated',
          'authenticated'
        );

        -- Inserir em public.profiles
        INSERT INTO public.profiles (
          id,
          name,
          email,
          role,
          job_title -- Opcional, mas mantendo consistência
        ) VALUES (
          new_id,
          'Cliente Teste ' || i,
          user_email,
          'CUSTOMER',
          'Cliente Visitante'
        );
    END IF;
  END LOOP;
END $$;
