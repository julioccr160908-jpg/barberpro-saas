-- 1. Update subscription_status check constraint to include 'pending'
ALTER TABLE public.organizations
DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;

ALTER TABLE public.organizations
ADD CONSTRAINT organizations_subscription_status_check
CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'pending'));

-- 2. Create RPC function for creating a pending organization
-- This function will be called by the frontend after user signup
CREATE OR REPLACE FUNCTION public.create_pending_organization(
    org_name TEXT,
    org_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges to bypass RLS limitations on INSERT if needed
AS $$
DECLARE
    new_org_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert organization as pending
    INSERT INTO public.organizations (name, slug, owner_id, subscription_status, plan_type)
    VALUES (org_name, org_slug, v_user_id, 'pending', 'basic')
    RETURNING id INTO new_org_id;

    -- Link user to this organization
    UPDATE public.profiles
    SET 
        organization_id = new_org_id,
        role = 'ADMIN' -- They are the admin of their own shop
    WHERE id = v_user_id;

    RETURN new_org_id;
END;
$$;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_pending_organization TO authenticated;

NOTIFY pgrst, 'reload schema';
