UPDATE auth.users 
SET encrypted_password = crypt('123456', gen_salt('bf')),
    email_confirmed_at = now()
WHERE email = 'dono1@gmail.com';
