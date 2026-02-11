/// <reference types="vite/client" />

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL;
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE;

interface SendMessagePayload {
    number: string;
    text: string;
}

interface InstanceInfo {
    connected: boolean;
    instanceName: string;
    ownerJid?: string; // Phone number connected (e.g. "5564999325011@s.whatsapp.net")
    profileName?: string;
    profilePicUrl?: string;
}

export const EvolutionApiService = {
    /**
     * Check if Evolution API is configured (env vars present)
     */
    isConfigured(): boolean {
        return !!(EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE);
    },

    /**
     * Send a text message via WhatsApp
     */
    async sendMessage(payload: SendMessagePayload): Promise<{ success: boolean; error?: any; data?: any }> {
        if (!this.isConfigured()) {
            console.warn("Evolution API not configured");
            return { success: false, error: "Configuração da Evolution API ausente" };
        }

        try {
            // Remove non-numeric characters from phone
            let cleanPhone = payload.number.replace(/\D/g, '');

            // Basic validation/formatting for Brazil (add 55 if missing)
            if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
                cleanPhone = '55' + cleanPhone;
            }

            if (cleanPhone.length < 10) {
                return { success: false, error: "Número de telefone inválido" };
            }

            const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({
                    number: cleanPhone,
                    options: {
                        delay: 1200,
                        presence: "composing",
                        linkPreview: false
                    },
                    textMessage: {
                        text: payload.text
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Evolution API Error:", data);
                const errorMsg = data?.message || data?.error || "Erro ao enviar mensagem";
                return { success: false, error: errorMsg };
            }

            return { success: true, data };

        } catch (error: any) {
            console.error("Evolution API Request Failed:", error);
            const errorMsg = error?.message?.includes('fetch failed')
                ? "Não foi possível conectar à Evolution API. Verifique se o tunnel está ativo."
                : error?.message || "Erro de conexão";
            return { success: false, error: errorMsg };
        }
    },

    /**
     * Check if WhatsApp is connected (returns boolean)
     */
    async checkConnection(): Promise<boolean> {
        if (!this.isConfigured()) return false;

        try {
            const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`, {
                method: 'GET',
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!response.ok) return false;

            const data = await response.json();
            return data?.instance?.state === 'open';
        } catch {
            return false;
        }
    },

    /**
     * Get detailed instance info (connection state, phone number, profile)
     */
    async getInstanceInfo(): Promise<InstanceInfo> {
        const defaultInfo: InstanceInfo = {
            connected: false,
            instanceName: EVOLUTION_INSTANCE || 'N/A'
        };

        if (!this.isConfigured()) return defaultInfo;

        try {
            // Check connection state
            const stateRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!stateRes.ok) return defaultInfo;

            const stateData = await stateRes.json();
            const connected = stateData?.instance?.state === 'open';

            if (!connected) return { ...defaultInfo, connected: false };

            // If connected, try to get instance details
            try {
                const infoRes = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${EVOLUTION_INSTANCE}`, {
                    headers: { 'apikey': EVOLUTION_API_KEY }
                });

                if (infoRes.ok) {
                    const infoData = await infoRes.json();
                    const instance = Array.isArray(infoData) ? infoData[0] : infoData;

                    return {
                        connected: true,
                        instanceName: instance?.instance?.instanceName || EVOLUTION_INSTANCE,
                        ownerJid: instance?.instance?.owner || undefined,
                        profileName: instance?.instance?.profileName || undefined,
                        profilePicUrl: instance?.instance?.profilePictureUrl || undefined
                    };
                }
            } catch {
                // If detail fetch fails, still return connected status
            }

            return { ...defaultInfo, connected: true };

        } catch {
            return defaultInfo;
        }
    },

    /**
     * Get the configured API URL (for display/debugging)
     */
    getApiUrl(): string {
        return EVOLUTION_API_URL || 'Não configurado';
    }
};
