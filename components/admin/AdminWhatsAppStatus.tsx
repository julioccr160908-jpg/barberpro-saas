
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EvolutionApiService } from '../../services/EvolutionApiService';
import { NotificationService } from '../../services/NotificationService';
import { Loader2, Wifi, WifiOff, Send, RefreshCw, Phone, CheckCircle, XCircle, MessageSquare, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectionInfo {
    connected: boolean;
    instanceName: string;
    ownerJid?: string;
    profileName?: string;
    profilePicUrl?: string;
}

export const AdminWhatsAppStatus: React.FC = () => {
    const [info, setInfo] = useState<ConnectionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('✅ Mensagem de teste do BarberPro! Se você recebeu esta mensagem, a integração WhatsApp está funcionando perfeitamente. 🚀');
    const [sending, setSending] = useState(false);
    const [checking, setChecking] = useState(false);

    const checkConnection = async () => {
        setChecking(true);
        try {
            const instanceInfo = await EvolutionApiService.getInstanceInfo();
            setInfo(instanceInfo);
        } catch {
            setInfo({ connected: false, instanceName: 'Erro' });
        } finally {
            setChecking(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    const handleSendTest = async () => {
        if (!testPhone.trim()) {
            toast.error('Digite o número de telefone');
            return;
        }

        setSending(true);
        try {
            const result = await NotificationService.sendDirect({
                phone: testPhone.trim(),
                text: testMessage
            });

            if (result.success) {
                toast.success('✅ Mensagem de teste enviada!');
            } else {
                toast.error(`Erro: ${result.error || 'Falha ao enviar'}`);
            }
        } catch (error: any) {
            toast.error(`Erro: ${error?.message || 'Falha ao enviar'}`);
        } finally {
            setSending(false);
        }
    };

    const formatPhoneNumber = (jid?: string) => {
        if (!jid) return null;
        // Format "5564999325011@s.whatsapp.net" → "+55 64 99932-5011"
        const clean = jid.replace('@s.whatsapp.net', '');
        if (clean.length === 13) {
            return `+${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 9)}-${clean.slice(9)}`;
        }
        return `+${clean}`;
    };

    const isConfigured = EvolutionApiService.isConfigured();

    if (!isConfigured) {
        return (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-start gap-4 p-6">
                    <div className="p-3 rounded-xl bg-yellow-500/20">
                        <WifiOff size={24} className="text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">WhatsApp Não Configurado</h3>
                        <p className="text-sm text-textMuted">
                            Configure as variáveis de ambiente <code className="text-yellow-400 bg-yellow-500/10 px-1 rounded">VITE_EVOLUTION_API_URL</code>,{' '}
                            <code className="text-yellow-400 bg-yellow-500/10 px-1 rounded">VITE_EVOLUTION_API_KEY</code> e{' '}
                            <code className="text-yellow-400 bg-yellow-500/10 px-1 rounded">VITE_EVOLUTION_INSTANCE</code> no arquivo <code>.env.local</code>.
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Connection Status Card */}
            <Card className={`overflow-hidden transition-all duration-500 ${info?.connected ? 'border-green-500/30' : 'border-red-500/20'}`}>
                {/* Status Header */}
                <div className={`p-6 flex items-center justify-between ${info?.connected ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${info?.connected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {loading || checking ? (
                                <Loader2 size={28} className="text-primary animate-spin" />
                            ) : info?.connected ? (
                                <Wifi size={28} className="text-green-400" />
                            ) : (
                                <WifiOff size={28} className="text-red-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                WhatsApp
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${info?.connected
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                    {loading ? '...' : info?.connected ? (
                                        <><CheckCircle size={12} /> Conectado</>
                                    ) : (
                                        <><XCircle size={12} /> Desconectado</>
                                    )}
                                </span>
                            </h3>
                            <p className="text-sm text-textMuted mt-0.5">
                                Instância: <span className="text-white font-medium">{info?.instanceName || '...'}</span>
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkConnection()}
                        disabled={checking}
                        className="border-white/10"
                    >
                        <RefreshCw size={16} className={`mr-2 ${checking ? 'animate-spin' : ''}`} />
                        Verificar
                    </Button>
                </div>

                {/* Connection Details */}
                {info?.connected && (
                    <div className="px-6 py-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {info.ownerJid && (
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-green-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-textMuted">Número</p>
                                    <p className="text-sm text-white font-medium">{formatPhoneNumber(info.ownerJid)}</p>
                                </div>
                            </div>
                        )}
                        {info.profileName && (
                            <div className="flex items-center gap-3">
                                <MessageSquare size={16} className="text-green-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-textMuted">Perfil</p>
                                    <p className="text-sm text-white font-medium">{info.profileName}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <ExternalLink size={16} className="text-primary flex-shrink-0" />
                            <div>
                                <p className="text-xs text-textMuted">API URL</p>
                                <p className="text-sm text-white font-medium truncate max-w-[200px]" title={EvolutionApiService.getApiUrl()}>
                                    {EvolutionApiService.getApiUrl()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disconnected Warning */}
                {!loading && !info?.connected && (
                    <div className="px-6 py-4 border-t border-red-500/10 bg-red-500/5">
                        <p className="text-sm text-red-300/80">
                            ⚠️ WhatsApp desconectado. As notificações por WhatsApp não serão enviadas.
                            Verifique se o Cloudflare Tunnel está ativo e se a instância no Evolution API está conectada.
                        </p>
                    </div>
                )}
            </Card>

            {/* Send Test Message Card */}
            {info?.connected && (
                <Card className="border-primary/10">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                            <Send size={20} className="text-primary" />
                            Enviar Mensagem de Teste
                        </h3>
                        <p className="text-sm text-textMuted mb-6">
                            Teste a integração enviando uma mensagem para qualquer número.
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Número (com DDD)</label>
                                <Input
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    placeholder="5564999325011"
                                    className="bg-black/30 border-white/10 focus:border-primary/50 font-mono"
                                />
                                <p className="text-xs text-textMuted">Formato: 55 + DDD + número (ex: 5511999999999)</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Mensagem</label>
                                <textarea
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors resize-y min-h-[80px]"
                                    rows={3}
                                />
                            </div>

                            <Button
                                onClick={handleSendTest}
                                disabled={sending || !testPhone.trim()}
                                className="w-full sm:w-auto"
                            >
                                {sending ? (
                                    <><Loader2 size={18} className="mr-2 animate-spin" /> Enviando...</>
                                ) : (
                                    <><Send size={18} className="mr-2" /> Enviar Teste</>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};
