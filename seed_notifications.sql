
-- Insert default notification templates for all organizations that don't have them

DO $$
DECLARE
    org_rec RECORD;
BEGIN
    FOR org_rec IN SELECT id FROM organizations LOOP
        
        -- 1. Confirmation (Email)
        IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE organization_id = org_rec.id AND type = 'confirmation' AND channel = 'email') THEN
            INSERT INTO notification_templates (organization_id, type, channel, subject, content, is_active)
            VALUES (org_rec.id, 'confirmation', 'email', 'Confirmação: {service_name}', 'Olá {customer_name}, seu agendamento para {service_name} em {date_time} foi confirmado.', true);
        END IF;

        -- 2. Reminder 24h (Email)
        IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE organization_id = org_rec.id AND type = 'reminder_24h' AND channel = 'email') THEN
            INSERT INTO notification_templates (organization_id, type, channel, subject, content, is_active)
            VALUES (org_rec.id, 'reminder_24h', 'email', 'Lembrete: Corte Amanhã', 'Olá {customer_name}, lembrete do seu corte amanhã às {time}.', true);
        END IF;

        -- 3. Reminder 1h (WhatsApp)
        IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE organization_id = org_rec.id AND type = 'reminder_1h' AND channel = 'whatsapp') THEN
            INSERT INTO notification_templates (organization_id, type, channel, subject, content, is_active)
            VALUES (org_rec.id, 'reminder_1h', 'whatsapp', NULL, 'Olá {customer_name}, seu corte é em 1 hora! ({time})', true);
        END IF;

        -- 4. Welcome (Email)
        IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE organization_id = org_rec.id AND type = 'welcome' AND channel = 'email') THEN
            INSERT INTO notification_templates (organization_id, type, channel, subject, content, is_active)
            VALUES (org_rec.id, 'welcome', 'email', 'Bem-vindo à {establishment_name}', 'Obrigado por se cadastrar na {establishment_name}!', true);
        END IF;

    END LOOP;
END $$;
