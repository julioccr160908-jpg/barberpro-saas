DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
BEGIN
    -- 1. Get the ID of the user that is currently logged in (julioccr1609)
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'julioccr1609@gmail.com';
    
    -- 2. Get the Organization ID
    SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'barberpro-demo';

    IF v_user_id IS NOT NULL AND v_org_id IS NOT NULL THEN
        -- 3. Upgrade Profile to SUPER_ADMIN and Link Organization
        UPDATE public.profiles
        SET 
            role = 'SUPER_ADMIN',
            organization_id = v_org_id
        WHERE id = v_user_id;

        -- 4. Optimistically make them the owner (or ensuring shared access via RLS)
        -- Since simple ownership is strict (owner_id = uid), let's switch ownership to this active user
        -- to guarantee immediate access.
        UPDATE public.organizations
        SET owner_id = v_user_id
        WHERE id = v_org_id;
        
        RAISE NOTICE 'User julioccr1609@gmail.com promoted and linked to organization.';
    END IF;
END $$;
