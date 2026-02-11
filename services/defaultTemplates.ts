// Default WhatsApp notification templates in Portuguese (BR)
// Auto-seeded when an organization has no templates configured

export interface DefaultTemplate {
    type: 'confirmation' | 'reminder_24h' | 'reminder_1h' | 'welcome' | 'cancelled';
    channel: 'whatsapp' | 'email';
    subject: string | null;
    content: string;
    is_active: boolean;
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
    // --- WhatsApp Templates ---
    {
        type: 'confirmation',
        channel: 'whatsapp',
        subject: null,
        content: `✅ *Agendamento Confirmado!*

Olá, {customer_name}! Seu horário está confirmado:

📋 *Serviço:* {service_name}
📅 *Data:* {date_time}
🏠 *Local:* {establishment_name}

Qualquer dúvida, entre em contato. Esperamos você! 💈`,
        is_active: true
    },
    {
        type: 'reminder_24h',
        channel: 'whatsapp',
        subject: null,
        content: `⏰ *Lembrete de Agendamento*

Olá, {customer_name}! Passando para lembrar que amanhã às *{time}* você tem:

📋 *{service_name}*
🏠 *{establishment_name}*

Nos vemos lá! 💈`,
        is_active: true
    },
    {
        type: 'reminder_1h',
        channel: 'whatsapp',
        subject: null,
        content: `🔔 {customer_name}, seu horário é *daqui a 1 hora*!

📋 {service_name} às {time}
🏠 {establishment_name}

Estamos te esperando! 💈`,
        is_active: true
    },
    {
        type: 'welcome',
        channel: 'whatsapp',
        subject: null,
        content: `🎉 *Bem-vindo à {establishment_name}!*

Olá, {customer_name}! Obrigado por escolher a gente.

Você pode agendar seus horários direto pelo nosso sistema online. Rápido e fácil!

Qualquer dúvida, estamos à disposição. 💈`,
        is_active: true
    },
    {
        type: 'cancelled',
        channel: 'whatsapp',
        subject: null,
        content: `❌ *Agendamento Cancelado*

Olá, {customer_name}. Infelizmente seu agendamento foi cancelado:

📋 *Serviço:* {service_name}
📅 *Data:* {date_time}

Para reagendar, acesse nosso sistema online ou entre em contato.

🏠 {establishment_name}`,
        is_active: true
    },

    // --- Email Templates (fallback) ---
    {
        type: 'confirmation',
        channel: 'email',
        subject: '✅ Agendamento Confirmado - {establishment_name}',
        content: `Olá {customer_name},

Seu agendamento foi confirmado!

Serviço: {service_name}
Data: {date_time}
Local: {establishment_name}

Esperamos você!`,
        is_active: true
    },
    {
        type: 'cancelled',
        channel: 'email',
        subject: '❌ Agendamento Cancelado - {establishment_name}',
        content: `Olá {customer_name},

Seu agendamento para {service_name} em {date_time} foi cancelado.

Para reagendar, acesse nosso sistema online.

{establishment_name}`,
        is_active: true
    }
];
