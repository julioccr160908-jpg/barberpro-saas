import { supabase } from './supabase';
import { EvolutionApiService } from './EvolutionApiService';

export interface SystemHealth {
    supabase: 'online' | 'offline';
    mercadopago: 'online' | 'offline';
    whatsapp: 'online' | 'offline' | 'unconfigured';
}

export const PlatformService = {
    /**
     * Comprehensive health check of system integrations
     */
    async checkSystemHealth(): Promise<SystemHealth> {
        const health: SystemHealth = {
            supabase: 'offline',
            mercadopago: 'offline',
            whatsapp: 'offline'
        };

        try {
            // 1. Check Supabase
            const { data, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
            if (!error) health.supabase = 'online';
        } catch (e) {
            console.error("Supabase health check failed:", e);
        }

        try {
            // 2. Check Mercado Pago
            // Client-side fetch to MP API is blocked by CORS. 
            // We check for token existence as a 'configured' status.
            if (import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN?.length > 10) {
                health.mercadopago = 'online';
            }
        } catch (e) {
            console.error("Mercado Pago configuration check failed:", e);
        }

        try {
            // 3. Check WhatsApp (Evolution API)
            const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
            if (!apiUrl) {
                health.whatsapp = 'unconfigured';
            } else {
                const res = await fetch(`${apiUrl}/instance/fetchInstances`, {
                    headers: { 'apikey': import.meta.env.VITE_EVOLUTION_API_KEY }
                });
                if (res.ok) health.whatsapp = 'online';
            }
        } catch (e) {
            console.error("WhatsApp health check failed:", e);
        }

        return health;
    },

    /**
     * Create an audit log entry
     */
    async logAction(params: {
        action: string,
        entity_type: string,
        entity_id?: string,
        organization_id?: string,
        old_data?: any,
        new_data?: any
    }) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('audit_logs').insert({
                user_id: user.id,
                organization_id: params.organization_id,
                action: params.action,
                entity_type: params.entity_type,
                entity_id: params.entity_id,
                old_data: params.old_data,
                new_data: params.new_data,
                user_agent: navigator.userAgent
            });
        } catch (e) {
            console.error("Failed to log audit action:", e);
        }
    },

    /**
     * Fetch active system broadcasts
     */
    async getActiveBroadcasts(targetRole?: string) {
        try {
            let query = supabase
                .from('system_broadcasts')
                .select('*')
                .eq('is_active', true)
                .lte('starts_at', new Date().toISOString())
                .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`);
            
            if (targetRole && targetRole !== 'all') {
                query = query.or(`target_role.eq.all,target_role.eq.${targetRole}`);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            return data;
        } catch (e) {
            console.error("Failed to fetch broadcasts:", e);
            return [];
        }
    }
};
