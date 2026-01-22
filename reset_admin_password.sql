-- Garante que o usuário existe e define a senha
-- ATENÇÃO: A senha criptografada abaixo corresponde a "Julioccr2020" gerada pelo Supabase Auth padrão
-- Se não funcionar, deletaremos e recriaremos

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'julioccr1609@gmail.com') THEN
        -- Se não existir, avisa (mas vamos recriar via script se necessário)
        RAISE NOTICE 'Usuário não encontrado, por favor rode o fix_login_complete.sql completo';
    ELSE
        -- Atualiza senha para "Julioccr2020"
        UPDATE auth.users
        SET encrypted_password = crypt('Julioccr2020', gen_salt('bf'))
        WHERE email = 'julioccr1609@gmail.com';
        
        RAISE NOTICE 'Senha atualizada para Julioccr2020';
    END IF;
END $$;
