DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'dono1@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User dono1@gmail.com not found in auth.users';
    END IF;

    -- 1. Ensure Profile Exists
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (v_user_id, 'dono1@gmail.com', 'Dono 1', 'ADMIN')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'ADMIN';

    -- 2. Ensure Organization Exists
    INSERT INTO public.organizations (name, slug, owner_id, subscription_status, plan_type)
    VALUES ('Barbearia Dono1', 'barbearia-dono1', v_user_id, 'pending', 'basic')
    ON CONFLICT (slug) DO UPDATE 
    SET owner_id = v_user_id
    RETURNING id INTO v_org_id;

    -- 3. Link Profile to Org
    UPDATE public.profiles
    SET organization_id = v_org_id
    WHERE id = v_user_id;

    RAISE NOTICE 'Fixed dono1 profile and org. User ID: %, Org ID: %', v_user_id, v_org_id;
END $$;
