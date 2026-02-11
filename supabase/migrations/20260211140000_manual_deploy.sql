-- ==============================================================================
-- SCRIPT DE DEPLOY PARA PRODUÇÃO (Supabase Remote)
-- ==============================================================================
-- Este script aplica todas as correções de schema, permissões e dados necessários
-- para que o sistema funcione corretamente em produção.
--
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard do seu projeto (ybzgpqwanlbpmyxwjjxc).
-- 2. Vá em no SQL Editor.
-- 3. Crie uma nova query, cole este conteúdo e execute (RUN).
-- ==============================================================================

-- 1. CORREÇÃO DE NOMES DE COLUNAS (Renames)
-- Garante que 'enabled' seja 'is_active' e 'body' seja 'content' em 'notification_templates'
-- Garante que 'description' seja 'title' em 'expenses'
DO $$ 
BEGIN 
    -- notification_templates
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_templates' AND column_name = 'enabled') THEN 
        ALTER TABLE notification_templates RENAME COLUMN enabled TO is_active; 
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_templates' AND column_name = 'content') THEN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_templates' AND column_name = 'body') THEN
             ALTER TABLE notification_templates DROP COLUMN content;
             ALTER TABLE notification_templates RENAME COLUMN body TO content;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_templates' AND column_name = 'body') THEN
        ALTER TABLE notification_templates RENAME COLUMN body TO content;
    END IF;

    -- expenses
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'description') THEN
        ALTER TABLE expenses RENAME COLUMN description TO title;
    END IF;
END $$;

-- 2. ADIÇÃO DE COLUNAS FALTANTES
-- Garante que todas as colunas necessárias existam
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_history jsonb DEFAULT '[]'::jsonb;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS commission_amount numeric DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category text;

-- 3. CORREÇÃO DE PERMISSÕES (RLS)
-- Permite que clientes leiam templates e gravem logs (essencial para notificações funcionarem)
DO $$
BEGIN
  -- Drop existing policies if they exist (to avoid errors on re-run)
  DROP POLICY IF EXISTS "Authenticated users can view templates" ON notification_templates;
  DROP POLICY IF EXISTS "Authenticated users can insert logs" ON notification_logs;
END $$;

CREATE POLICY "Authenticated users can view templates"
ON notification_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert logs"
ON notification_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

/*
-- 4. SEED DE TEMPLATES PADRÃO
-- Ensure unique constraint exists for ON CONFLICT to work
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_templates_unique ON notification_templates (organization_id, type, channel);

-- Insere templates para todas as organizações que ainda não os possuem
INSERT INTO notification_templates (organization_id, type, channel, subject, content, is_active)
SELECT 
    o.id, 
    t.type, 
    t.channel, 
    t.subject,
    t.content, 
    true
FROM organizations o
CROSS JOIN (VALUES 
    -- WhatsApp Templates
    ('confirmation', 'whatsapp', NULL, e'✅ *Agendamento Confirmado!*\n\nOlá, {customer_name}! Seu horário está confirmado:\n\n📋 *Serviço:* {service_name}\n📅 *Data:* {date_time}\n🏠 *Local:* {establishment_name}\n\nQualquer dúvida, entre em contato. Esperamos você! 💈'),
    ('reminder_24h', 'whatsapp', NULL, e'⏰ *Lembrete de Agendamento*\n\nOlá, {customer_name}! Passando para lembrar que amanhã às *{time}* você tem:\n\n📋 *{service_name}*\n🏠 *{establishment_name}*\n\nNos vemos lá! 💈'),
    ('reminder_1h', 'whatsapp', NULL, e'🔔 {customer_name}, seu horário é *daqui a 1 hora*!\n\n📋 {service_name} às {time}\n🏠 {establishment_name}\n\nEstamos te esperando! 💈'),
    ('welcome', 'whatsapp', NULL, e'🎉 *Bem-vindo à {establishment_name}!*\n\nOlá, {customer_name}! Obrigado por escolher a gente.\n\nVocê pode agendar seus horários direto pelo nosso sistema online. Rápido e fácil!\n\nQualquer dúvida, estamos à disposição. 💈'),
    ('cancelled', 'whatsapp', NULL, e'❌ *Agendamento Cancelado*\n\nOlá, {customer_name}. Infelizmente seu agendamento foi cancelado:\n\n📋 *Serviço:* {service_name}\n📅 *Data:* {date_time}\n\nPara reagendar, acesse nosso sistema online ou entre em contato.\n\n🏠 {establishment_name}'),
    
    -- Email Templates
    ('confirmation', 'email', '✅ Agendamento Confirmado - {establishment_name}', e'Olá {customer_name},\n\nSeu agendamento foi confirmado!\n\nServiço: {service_name}\nData: {date_time}\nLocal: {establishment_name}\n\nEsperamos você!'),
    ('cancelled', 'email', '❌ Agendamento Cancelado - {establishment_name}', e'Olá {customer_name},\n\nSeu agendamento para {service_name} em {date_time} foi cancelado.\n\nPara reagendar, acesse nosso sistema online.\n\n{establishment_name}')
) AS t(type, channel, subject, content)
ON CONFLICT (organization_id, type, channel) DO NOTHING;
*/

-- FIM DO SCRIPT
