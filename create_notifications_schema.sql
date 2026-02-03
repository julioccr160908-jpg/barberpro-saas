
-- Create Notification Templates Table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('confirmation', 'reminder_24h', 'reminder_1h', 'welcome')),
    channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
    subject TEXT, -- For Email
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, type, channel)
);

-- Create Notification Logs Table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id), -- Or profiles(id)
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.notification_templates(id),
    channel TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Templates: Read/Write by Admins/Owners of the Org
CREATE POLICY "Org Admins can manage templates" ON public.notification_templates
    USING (auth.uid() IN (SELECT owner_id FROM public.organizations WHERE id = organization_id) OR public.is_super_admin())
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.organizations WHERE id = organization_id) OR public.is_super_admin());

-- Logs: Read by Admins/Owners
CREATE POLICY "Org Admins can view logs" ON public.notification_logs
    FOR SELECT
    USING (auth.uid() IN (SELECT owner_id FROM public.organizations WHERE id = organization_id) OR public.is_super_admin());

-- Insert Default Templates for existing Organizations
DO $$
DECLARE
    org RECORD;
BEGIN
    FOR org IN SELECT id FROM public.organizations LOOP
        -- 1. Confirmation Email
        INSERT INTO public.notification_templates (organization_id, type, channel, subject, content)
        VALUES (
            org.id, 
            'confirmation', 
            'email', 
            'Agendamento Confirmado - {establishment_name}',
            'Olá {customer_name}, seu agendamento para {service_name} em {date_time} foi confirmado.'
        ) ON CONFLICT DO NOTHING;

        -- 2. Reminder 24h Email
        INSERT INTO public.notification_templates (organization_id, type, channel, subject, content)
        VALUES (
            org.id, 
            'reminder_24h', 
            'email', 
            'Lembrete: Corte Amanhã - {establishment_name}',
            'Olá {customer_name}, este é um lembrete do seu agendamento amanhã às {time}.'
        ) ON CONFLICT DO NOTHING;

         -- 3. Welcome Email
        INSERT INTO public.notification_templates (organization_id, type, channel, subject, content)
        VALUES (
            org.id, 
            'welcome', 
            'email', 
            'Bem-vindo à {establishment_name}',
            'Olá {customer_name}, obrigado por se cadastrar na nossa barbearia!'
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
