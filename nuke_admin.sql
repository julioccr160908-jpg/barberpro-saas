DO $$
DECLARE
    v_email TEXT := 'julio1609@gmail.com';
BEGIN
    -- Delete from profiles first (fk)
    DELETE FROM public.profiles WHERE email = v_email;
    
    -- Delete from identities
    DELETE FROM auth.identities WHERE email = v_email;

    -- Delete from auth.users
    DELETE FROM auth.users WHERE email = v_email;
END $$;
