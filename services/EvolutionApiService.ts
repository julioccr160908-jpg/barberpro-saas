/// <reference types="vite/client" />

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL;
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;

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
        return !!(EVOLUTION_API_URL && EVOLUTION_API_KEY);
    },

    /**
     * Create a new instance in the Evolution API for an organization
     */
    async createInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
        if (!this.isConfigured()) {
            return { success: false, error: 'Evolution API não configurada' };
        }

        try {
            const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({
                    instanceName,
                    token: window.crypto.randomUUID(),
                    integration: 'WHATSAPP-BAILEYS',
                    qrcode: true,
                    rejectCall: false,
                    groupsIgnore: true,
                    alwaysOnline: false,
                    readMessages: false,
                    readStatus: false,
                    syncFullHistory: false
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // If instance already exists, that's OK
                if (data?.message?.includes?.('already') || data?.error?.includes?.('already')) {
                    return { success: true };
                }
                return { success: false, error: data?.message || data?.error || 'Erro ao criar instância' };
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error?.message || 'Erro de conexão' };
        }
    },

    /**
     * Send a text message via WhatsApp using a specific instance
     */
    async sendMessage(instanceName: string, payload: SendMessagePayload): Promise<{ success: boolean; error?: any; data?: any }> {
        if (!this.isConfigured()) {
            console.warn("Evolution API not configured");
            return { success: false, error: "Configuração da Evolution API ausente" };
        }

        if (!instanceName) {
            return { success: false, error: "Instância WhatsApp não configurada para esta barbearia" };
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

            const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
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
     * Check if WhatsApp is connected for a specific instance
     */
    async checkConnection(instanceName: string): Promise<boolean> {
        if (!this.isConfigured() || !instanceName) return false;

        try {
            const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
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
     * Get QR Code to connect a specific instance
     */
    async getQrCode(instanceName: string): Promise<{ success: boolean; qr?: string; error?: string }> {
        if (!this.isConfigured()) return { success: false, error: 'Não configurado' };
        if (!instanceName) return { success: false, error: 'Instância não definida' };

        try {
            const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
                method: 'GET',
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            const data = await response.json();

            if (data?.instance?.state === 'open') {
                return { success: true, error: 'Já conectado' }; // Already connected
            }

            if (data?.base64) {
                return { success: true, qr: data.base64 };
            }

            return { success: false, error: data?.message || 'QR Code não disponível' };
        } catch (error: any) {
            return { success: false, error: 'Erro de conexão com a API' };
        }
    },

    /**
     * Get detailed instance info for a specific instance
     */
    async getInstanceInfo(instanceName: string): Promise<InstanceInfo> {
        const defaultInfo: InstanceInfo = {
            connected: false,
            instanceName: instanceName || 'N/A'
        };

        if (!this.isConfigured() || !instanceName) return defaultInfo;

        try {
            // Check connection state
            const stateRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!stateRes.ok) return defaultInfo;

            const stateData = await stateRes.json();
            const connected = stateData?.instance?.state === 'open';

            if (!connected) return { ...defaultInfo, connected: false };

            // If connected, try to get instance details
            try {
                const infoRes = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
                    headers: { 'apikey': EVOLUTION_API_KEY }
                });

                if (infoRes.ok) {
                    const infoData = await infoRes.json();
                    const instance = Array.isArray(infoData) ? infoData[0] : infoData;

                    return {
                        connected: true,
                        instanceName: instance?.instance?.instanceName || instanceName,
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
     * Logout of an instance
     */
    async logoutInstance(instanceName: string): Promise<boolean> {
        if (!this.isConfigured() || !instanceName) return false;
        try {
            const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': EVOLUTION_API_KEY }
            });
            return response.ok;
        } catch {
            return false;
        }
    },

    /**
     * Delete an instance
     */
    async deleteInstance(instanceName: string): Promise<boolean> {
        if (!this.isConfigured() || !instanceName) return false;
        try {
            const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': EVOLUTION_API_KEY }
            });
            return response.ok;
        } catch {
            return false;
        }
    },

    /**
     * Get the configured API URL (for display/debugging)
     */
    getApiUrl(): string {
        return EVOLUTION_API_URL || 'Não configurado';
    }
};
