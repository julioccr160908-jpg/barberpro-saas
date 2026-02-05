-- Reset password for dono3@gmail.com to '123456'

UPDATE auth.users
SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email = 'dono3@gmail.com';

-- Verify if updated
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'dono3@gmail.com') THEN
        RAISE EXCEPTION 'User dono3@gmail.com not found! You may need to register first.';
    ELSE
        RAISE NOTICE 'Password updated for dono3@gmail.com';
    END IF;
END $$;