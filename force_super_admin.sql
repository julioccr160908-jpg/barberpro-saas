DO $$
BEGIN
    UPDATE public.profiles
    SET role = 'SUPER_ADMIN'
    WHERE email = 'julio1609@gmail.com';
END $$;
