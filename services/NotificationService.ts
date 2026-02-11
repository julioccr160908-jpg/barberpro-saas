
import { supabase } from './supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EvolutionApiService } from './EvolutionApiService';
import { DEFAULT_TEMPLATES } from './defaultTemplates';

interface NotificationPayload {
    organizationId?: string;
    appointmentId: string;
    customerId: string;
    type: 'confirmation' | 'reminder_24h' | 'reminder_1h' | 'welcome' | 'cancelled';
}

interface DirectMessagePayload {
    phone: string;
    text: string;
}

export const NotificationService = {
    /**
     * Send a notification based on appointment and template
     */
    async sendById(payload: NotificationPayload) {
        console.log("📨 Processing notification:", payload.type);

        try {
            // 1. Fetch Appointment with relations
            const { data: appointment } = await supabase
                .from('appointments')
                .select(`
                    *,
                    service:services(name),
                    customer:profiles!customer_id(name, email, phone),
                    organization:organizations(name)
                `)
                .eq('id', payload.appointmentId)
                .single();

            if (!appointment) {
                console.error("❌ Appointment not found:", payload.appointmentId);
                await this._logError(payload, 'Appointment not found');
                return;
            }

            // Derive Org ID from appointment if not provided
            const orgId = payload.organizationId || appointment.organization_id;

            if (!orgId) {
                console.error("❌ Organization ID missing for appointment", appointment.id);
                await this._logError(payload, 'Organization ID missing');
                return;
            }

            // 2. Fetch Templates (with auto-seed fallback)
            let { data: templates } = await supabase
                .from('notification_templates')
                .select('*')
                .eq('organization_id', orgId)
                .eq('type', payload.type)
                .eq('is_active', true);

            // Auto-seed if no templates exist at all for this org
            if (!templates || templates.length === 0) {
                console.log("🌱 No templates found, auto-seeding defaults for org:", orgId);
                await this._seedDefaultTemplates(orgId);

                // Re-fetch after seeding
                const { data: seededTemplates } = await supabase
                    .from('notification_templates')
                    .select('*')
                    .eq('organization_id', orgId)
                    .eq('type', payload.type)
                    .eq('is_active', true);

                templates = seededTemplates;
            }

            if (!templates || templates.length === 0) {
                console.log("⚠️ No active template for", payload.type);
                await this._logError({ ...payload, organizationId: orgId }, `No active template for ${payload.type}`);
                return;
            }

            // Prioritize WhatsApp, fallback to Email
            let template = templates.find(t => t.channel === 'whatsapp');
            if (!template) {
                template = templates.find(t => t.channel === 'email');
            }

            if (!template) {
                await this._logError({ ...payload, organizationId: orgId }, `No template found for ${payload.type}`);
                return;
            }

            // 3. Replace Variables
            const appointmentDate = appointment.date ? parseISO(appointment.date) : new Date();
            const vars: Record<string, string> = {
                customer_name: appointment.customer?.name || 'Cliente',
                service_name: appointment.service?.name || 'Serviço',
                establishment_name: appointment.organization?.name || 'Barbearia',
                date_time: format(appointmentDate, "dd/MM 'às' HH:mm", { locale: ptBR }),
                time: format(appointmentDate, "HH:mm"),
            };

            let content = template.content;
            let subject = template.subject || '';

            Object.entries(vars).forEach(([key, value]) => {
                content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
                subject = subject.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
            });

            // 4. Send Message
            let sendResult: { success: boolean; error?: any } = { success: false };

            if (template.channel === 'whatsapp' && appointment.customer?.phone) {
                console.log("📱 Sending WhatsApp to:", appointment.customer.phone);
                sendResult = await EvolutionApiService.sendMessage({
                    number: appointment.customer.phone,
                    text: content
                });

                if (sendResult.success) {
                    console.log("✅ WhatsApp sent successfully!");
                } else {
                    console.warn("⚠️ WhatsApp failed, error:", sendResult.error);
                }
            } else if (template.channel === 'email') {
                console.log("📧 Email (simulated):", appointment.customer?.email);
                console.log("Subject:", subject);
                console.log("Body:", content);
                sendResult = { success: true };
            }

            // 5. Log the notification
            await supabase.from('notification_logs').insert({
                organization_id: orgId,
                customer_id: payload.customerId,
                appointment_id: payload.appointmentId,
                template_id: template.id,
                channel: template.channel,
                status: sendResult.success ? 'sent' : 'failed',
                sent_at: new Date().toISOString(),
                error_message: sendResult.success ? null : (typeof sendResult.error === 'string' ? sendResult.error : JSON.stringify(sendResult.error))
            });

        } catch (error: any) {
            console.error("❌ Failed to send notification:", error);
            try {
                await supabase.from('notification_logs').insert({
                    organization_id: payload.organizationId,
                    customer_id: payload.customerId,
                    appointment_id: payload.appointmentId,
                    status: 'failed',
                    channel: 'unknown', // Required by DB
                    recipient: 'unknown', // Required by DB
                    error_message: error?.message || 'Unknown error'
                });
            } catch (_) { /* Silently fail log insertion */ }
        }
    },

    /**
     * Send a direct message (no template, no appointment needed)
     * Used for admin test messages and custom notifications
     */
    async sendDirect(payload: DirectMessagePayload): Promise<{ success: boolean; error?: string }> {
        if (!EvolutionApiService.isConfigured()) {
            return { success: false, error: "Evolution API não configurada" };
        }

        const result = await EvolutionApiService.sendMessage({
            number: payload.phone,
            text: payload.text
        });

        return {
            success: result.success,
            error: result.success ? undefined : (typeof result.error === 'string' ? result.error : 'Erro ao enviar')
        };
    },

    /**
     * Helper to log errors to DB
     */
    async _logError(payload: any, errorMessage: string) {
        if (!payload.organizationId) {
            console.warn("⚠️ Cannot log error to DB without organizationId:", errorMessage);
            return;
        }

        try {
            await supabase.from('notification_logs').insert({
                organization_id: payload.organizationId,
                customer_id: payload.customerId,
                appointment_id: payload.appointmentId,
                status: 'failed',
                channel: 'unknown',
                recipient: 'unknown',
                error_message: errorMessage
            });
        } catch (e) {
            console.error("Failed to log error to DB:", e);
        }
    },

    /**
     * Seed default notification templates for an organization
     */
    async _seedDefaultTemplates(orgId: string) {
        try {
            const rows = DEFAULT_TEMPLATES.map(t => ({
                organization_id: orgId,
                type: t.type,
                channel: t.channel,
                subject: t.subject,
                content: t.content,
                is_active: t.is_active
            }));

            const { error } = await supabase
                .from('notification_templates')
                .upsert(rows, { onConflict: 'organization_id,type,channel' });

            if (error) {
                console.error("❌ Error seeding templates:", error);
            } else {
                console.log(`✅ Seeded ${rows.length} default templates for org ${orgId}`);
            }
        } catch (e) {
            console.error("❌ Failed to seed templates:", e);
        }
    }
};
