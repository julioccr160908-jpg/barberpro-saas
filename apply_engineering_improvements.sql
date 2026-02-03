-- 1. Unique Constraint on Slug (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_slug_key') THEN
        ALTER TABLE public.organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);
    END IF;
END $$;

-- 2. Indices for Performance
CREATE INDEX IF NOT EXISTS idx_appointments_org_date ON public.appointments (organization_id, date);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles (organization_id);

-- 3. Validation in RPC
CREATE OR REPLACE FUNCTION public.create_pending_organization(
    org_name TEXT,
    org_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_org_id UUID;
    v_user_id UUID;
BEGIN
    -- Input Validation
    IF NOT org_slug ~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.';
    END IF;

    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert organization as pending (Constraint will trap duplicates now)
    INSERT INTO public.organizations (name, slug, owner_id, subscription_status, plan_type)
    VALUES (org_name, org_slug, v_user_id, 'pending', 'basic')
    RETURNING id INTO new_org_id;

    -- Link user to this organization
    UPDATE public.profiles
    SET 
        organization_id = new_org_id,
        role = 'ADMIN'
    WHERE id = v_user_id;

    -- Insert Default Notification Templates
    INSERT INTO public.notification_templates (organization_id, type, channel, subject, content, is_active)
    VALUES 
    (new_org_id, 'confirmation', 'email', 'Confirmação: {service_name}', 'Olá {customer_name}, seu agendamento para {service_name} em {date_time} foi confirmado.', true),
    (new_org_id, 'reminder_24h', 'email', 'Lembrete: Corte Amanhã', 'Olá {customer_name}, lembrete do seu corte amanhã às {time}.', true),
    (new_org_id, 'reminder_1h', 'whatsapp', NULL, 'Olá {customer_name}, seu corte é em 1 hora! ({time})', true),
    (new_org_id, 'welcome', 'email', 'Bem-vindo à {establishment_name}', 'Obrigado por se cadastrar na {establishment_name}!', true);

    RETURN new_org_id;
END;
$$;

-- Grant permissions again just in case
GRANT EXECUTE ON FUNCTION public.create_pending_organization TO authenticated;
