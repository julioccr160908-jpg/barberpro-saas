
import { supabase } from './supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationPayload {
    organizationId?: string; // Optional: If missing, we derive from appointment
    appointmentId: string;
    customerId: string;
    type: 'confirmation' | 'reminder_24h' | 'reminder_1h' | 'welcome';
}

export const NotificationService = {
    async sendById(payload: NotificationPayload) {
        console.log("Processing notification:", payload.type);

        try {
            // 1. Fetch Data First (Appointment + Relations) to get Org ID if needed
            const { data: appointment } = await supabase
                .from('appointments')
                .select(`
                    *,
                    service:services(name),
                    customer:profiles!customer_id(name, email),
                    organization:organizations(name)
                `)
                .eq('id', payload.appointmentId)
                .single();

            if (!appointment) throw new Error("Appointment not found");

            // Derive Org ID
            // 'organization_id' should be on the appointment record if RLS/Triggers worked.
            // If strictly typed, cast it. In Supabase JS, foreign keys are usually snake_case.
            const orgId = payload.organizationId || appointment.organization_id;

            if (!orgId) {
                console.error("Organization ID missing for appointment", appointment.id);
                // Try fallback via barber metadata if implemented, but for now abort
                return;
            }

            // 2. Fetch Template using derived Org ID
            const { data: templates } = await supabase
                .from('notification_templates')
                .select('*')
                .eq('organization_id', orgId)
                .eq('type', payload.type)
                .eq('is_active', true);

            if (!templates || templates.length === 0) {
                console.log("No active template for", payload.type);
                return;
            }

            // For now, handling EMAIL only or prioritizing it
            const template = templates.find(t => t.channel === 'email') || templates[0];

            // 3. Replace Variables
            const vars = {
                customer_name: appointment.customer?.name || 'Cliente',
                service_name: appointment.service?.name || 'Serviço',
                establishment_name: appointment.organization?.name || 'Barbearia',
                date_time: format(parseISO(appointment.date), "dd/MM 'às' HH:mm", { locale: ptBR }),
                time: format(parseISO(appointment.date), "HH:mm"),
            };

            let content = template.content;
            let subject = template.subject || '';

            Object.entries(vars).forEach(([key, value]) => {
                content = content.replace(new RegExp(`{${key}}`, 'g'), value);
                subject = subject.replace(new RegExp(`{${key}}`, 'g'), value);
            });

            // 4. Simulate Sending (Log)
            // In a real scenario, we would call Resend/Twilio here.

            console.log("🚀 SENDING NOTIFICATION:");
            console.log("To:", appointment.customer?.email);
            console.log("Subject:", subject);
            console.log("Body:", content);

            // 5. Create Log
            await supabase.from('notification_logs').insert({
                organization_id: payload.organizationId,
                customer_id: payload.customerId,
                appointment_id: payload.appointmentId,
                template_id: template.id,
                channel: template.channel,
                status: 'sent', // Simulating success
                sent_at: new Date().toISOString(),
                // Store actual content for debugging/history
                error_message: `Simulated: ${subject}`
            });

        } catch (error) {
            console.error("Failed to send notification:", error);
            // Log failure
            await supabase.from('notification_logs').insert({
                organization_id: payload.organizationId,
                customer_id: payload.customerId,
                appointment_id: payload.appointmentId,
                // template_id might be missing if that failed
                status: 'failed',
                error_message: (error as Error).message
            });
        }
    }
};
