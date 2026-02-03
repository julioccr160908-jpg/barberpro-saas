-- Adicionar tabelas faltantes ao servidor online
-- Esta migração adiciona: organizations, expenses, notification_logs, notification_templates

-- 1. Função is_super_admin (necessária para policies)
CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
END;
$$;

GRANT ALL ON FUNCTION public.is_super_admin() TO anon;
GRANT ALL ON FUNCTION public.is_super_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_super_admin() TO service_role;

-- 2. Tabela organizations (base para multitenancy)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    owner_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    subscription_status text DEFAULT 'trial'::text,
    plan_type text DEFAULT 'basic'::text,
    logo_url text,
    banner_url text,
    primary_color text,
    secondary_color text,
    theme_mode text DEFAULT 'dark'::text,
    CONSTRAINT organizations_pkey PRIMARY KEY (id),
    CONSTRAINT organizations_slug_key UNIQUE (slug),
    CONSTRAINT organizations_subscription_status_check CHECK ((subscription_status = ANY (ARRAY['trial'::text, 'active'::text, 'past_due'::text, 'canceled'::text, 'pending'::text])))
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Authenticated Insert" ON public.organizations FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Owner Update" ON public.organizations FOR UPDATE USING (((auth.uid() = owner_id) OR public.is_super_admin()));
CREATE POLICY "Owner Delete" ON public.organizations FOR DELETE USING (((auth.uid() = owner_id) OR public.is_super_admin()));

GRANT ALL ON TABLE public.organizations TO anon;
GRANT ALL ON TABLE public.organizations TO authenticated;
GRANT ALL ON TABLE public.organizations TO service_role;
GRANT ALL ON TABLE public.organizations TO supabase_auth_admin;

-- 3. Tabela expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    category text,
    date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT expenses_pkey PRIMARY KEY (id),
    CONSTRAINT expenses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expenses" ON public.expenses USING (
    (auth.uid() IN (SELECT owner_id FROM public.organizations WHERE id = expenses.organization_id)) 
    OR public.is_super_admin()
) WITH CHECK (
    (auth.uid() IN (SELECT owner_id FROM public.organizations WHERE id = expenses.organization_id)) 
    OR public.is_super_admin()
);

GRANT ALL ON TABLE public.expenses TO anon;
GRANT ALL ON TABLE public.expenses TO authenticated;
GRANT ALL ON TABLE public.expenses TO service_role;

-- 4. Tabela notification_templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    type text NOT NULL,
    channel text NOT NULL,
    subject text,
    body text NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT notification_templates_pkey PRIMARY KEY (id),
    CONSTRAINT notification_templates_organization_id_type_channel_key UNIQUE (organization_id, type, channel),
    CONSTRAINT notification_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org Admins can manage templates" ON public.notification_templates USING (
    (auth.uid() IN (SELECT owner_id FROM public.organizations WHERE id = notification_templates.organization_id)) 
    OR public.is_super_admin()
) WITH CHECK (
    (auth.uid() IN (SELECT owner_id FROM public.organizations WHERE id = notification_templates.organization_id)) 
    OR public.is_super_admin()
);

GRANT ALL ON TABLE public.notification_templates TO anon;
GRANT ALL ON TABLE public.notification_templates TO authenticated;
GRANT ALL ON TABLE public.notification_templates TO service_role;

-- 5. Tabela notification_logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    template_id uuid,
    customer_id uuid,
    appointment_id uuid,
    channel text NOT NULL,
    recipient text NOT NULL,
    status text DEFAULT 'pending'::text,
    sent_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT notification_logs_pkey PRIMARY KEY (id),
    CONSTRAINT notification_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
    CONSTRAINT notification_logs_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.notification_templates(id),
    CONSTRAINT notification_logs_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL,
    CONSTRAINT notification_logs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org Admins can view logs" ON public.notification_logs FOR SELECT USING (
    (auth.uid() IN (SELECT owner_id FROM public.organizations WHERE id = notification_logs.organization_id)) 
    OR public.is_super_admin()
);

GRANT ALL ON TABLE public.notification_logs TO anon;
GRANT ALL ON TABLE public.notification_logs TO authenticated;
GRANT ALL ON TABLE public.notification_logs TO service_role;
