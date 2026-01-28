DO $$
DECLARE
    v_owner_id UUID;
    v_org_id UUID;
BEGIN
    -- Get owner ID
    SELECT id INTO v_owner_id FROM auth.users WHERE email = 'dono1@gmail.com';
    
    IF v_owner_id IS NULL THEN
        RAISE NOTICE 'User dono1@gmail.com not found';
        RETURN;
    END IF;

    -- Try to insert org
    INSERT INTO public.organizations (name, slug, owner_id, subscription_status, plan_type)
    VALUES ('Barbearia Dono1', 'barbearia-dono1', v_owner_id, 'pending', 'basic')
    RETURNING id INTO v_org_id;

    -- Update profile
    UPDATE public.profiles
    SET 
        organization_id = v_org_id,
        role = 'ADMIN'
    WHERE id = v_owner_id;

    RAISE NOTICE 'Organization created with ID: %', v_org_id;
END $$;
