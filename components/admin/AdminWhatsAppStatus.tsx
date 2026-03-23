
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EvolutionApiService } from '../../services/EvolutionApiService';
import { NotificationService } from '../../services/NotificationService';
import { useOrganization } from '../../contexts/OrganizationContext';
import { supabase } from '../../services/supabase';
import { Loader2, Wifi, WifiOff, Send, RefreshCw, Phone, CheckCircle, XCircle, MessageSquare, ExternalLink, QrCode, Plus, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { FeatureGate } from '../ui/FeatureGate';

interface ConnectionInfo {
    connected: boolean;
    instanceName: string;
    ownerJid?: string;
    profileName?: string;
    profilePicUrl?: string;
}

export const AdminWhatsAppStatus: React.FC = () => {
    const { organization, refreshOrganization } = useOrganization();
    const [info, setInfo] = useState<ConnectionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('✅ Mensagem de teste do BarberHost! Se você recebeu esta mensagem, a integração WhatsApp está funcionando perfeitamente. 🚀');
    const [sending, setSending] = useState(false);
    const [checking, setChecking] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loadingQr, setLoadingQr] = useState(false);
    const [creatingInstance, setCreatingInstance] = useState(false);
    const [reseting, setReseting] = useState(false);

    const instanceName = organization?.whatsappInstanceName;

    const checkConnection = async () => {
        if (!instanceName) {
            setLoading(false);
            return;
        }

        setChecking(true);
        try {
            const instanceInfo = await EvolutionApiService.getInstanceInfo(instanceName);
            setInfo(instanceInfo);

            // Update whatsapp_connected in DB if state changed
            if (organization && instanceInfo.connected !== organization.whatsappConnected) {
                await supabase.from('organizations').update({
                    whatsapp_connected: instanceInfo.connected
                }).eq('id', organization.id);
                refreshOrganization();
            }
        } catch {
            setInfo({ connected: false, instanceName: instanceName || 'Erro' });
        } finally {
            setChecking(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (instanceName) {
            checkConnection();
        } else {
            setLoading(false);
        }

        // Auto-refresh if QR Code is active (meaning user is trying to connect)
        let interval: NodeJS.Timeout;
        if (qrCode && !info?.connected && instanceName) {
            interval = setInterval(() => {
                checkConnection();
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [qrCode, info?.connected, instanceName]);

    const handleCreateInstance = async () => {
        if (!organization) return;

        setCreatingInstance(true);
        try {
            const newInstanceName = `${organization.slug}-whatsapp`;
            const result = await EvolutionApiService.createInstance(newInstanceName);

            if (result.success) {
                // Save instance name to DB
                const { error } = await supabase.from('organizations').update({
                    whatsapp_instance_name: newInstanceName,
                    whatsapp_connected: false
                }).eq('id', organization.id);

                if (error) {
                    toast.error('Erro ao salvar instância no banco');
                    console.error('DB Error:', error);
                    return;
                }

                toast.success('Instância WhatsApp criada! Agora conecte escaneando o QR Code.');
                await refreshOrganization();

                // Auto-trigger QR code generation
                setTimeout(async () => {
                    const qrResult = await EvolutionApiService.getQrCode(newInstanceName);
                    if (qrResult.success && qrResult.qr) {
                        setQrCode(qrResult.qr);
                    }
                }, 1000);
            } else {
                toast.error(result.error || 'Erro ao criar instância');
            }
        } catch (error: any) {
            toast.error('Falha ao criar instância WhatsApp');
            console.error(error);
        } finally {
            setCreatingInstance(false);
        }
    };

    const handleConnect = async (isRetry = false) => {
        if (!instanceName) return;

        if (!isRetry) setLoadingQr(true);
        if (!isRetry) setQrCode(null);

        try {
            const res = await EvolutionApiService.getQrCode(instanceName);
            if (res.success && res.qr) {
                setQrCode(res.qr);
                if (!isRetry) toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
            } else if (res.success && !res.qr) {
                if (!isRetry) toast.info('Gerando QR Code, aguarde...');
                // The API is preparing the instance, retry in 3 seconds to get the actual QR
                setTimeout(() => handleConnect(true), 3000);
            } else {
                toast.error(res.error || 'Erro ao gerar QR Code');
            }
        } catch (error) {
            toast.error('Geração de QR Code falhou');
        } finally {
            if (!isRetry) setLoadingQr(false);
        }
    };

    const handleLogout = async () => {
        if (!instanceName) return;

        const ok = window.confirm('Tem certeza que deseja desconectar o WhatsApp?');
        if (!ok) return;

        setChecking(true);
        try {
            await EvolutionApiService.logoutInstance(instanceName);
            toast.success('WhatsApp desconectado!');
            await checkConnection();
        } catch (error) {
            toast.error('Erro ao desconectar');
        } finally {
            setChecking(false);
        }
    };

    const handleReset = async () => {
        if (!instanceName || !organization) return;

        const ok = window.confirm('Isso irá remover a instância atual e criar uma nova. Deseja continuar?');
        if (!ok) return;

        setReseting(true);
        try {
            // Try to delete the instance in Evolution API, but don't stop if it fails 
            // (might already be deleted or server down)
            try {
                await EvolutionApiService.deleteInstance(instanceName);
            } catch (apiError) {
                console.warn('API delete failed, continuing with DB cleanup:', apiError);
            }

            // Clear the instance name in DB
            const { error: dbError } = await supabase.from('organizations').update({
                whatsapp_instance_name: null,
                whatsapp_connected: false
            }).eq('id', organization.id);

            if (dbError) {
                console.error('DB Reset Error:', dbError);
                toast.error(`Erro ao atualizar banco: ${dbError.message}`);
                return;
            }

            setInfo(null);
            setQrCode(null);
            toast.success('Instância resetada com sucesso! Você pode ativar novamente.');
            await refreshOrganization();
        } catch (error: any) {
            toast.error('Erro ao resetar instância');
            console.error(error);
        } finally {
            setReseting(false);
        }
    };

    const handleSendTest = async () => {
        if (!testPhone.trim() || !instanceName) {
            toast.error(!instanceName ? 'Instância WhatsApp não configurada' : 'Digite o número de telefone');
            return;
        }

        setSending(true);
        try {
            const result = await NotificationService.sendDirect({
                phone: testPhone.trim(),
                text: testMessage,
                instanceName
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
        const clean = jid.replace('@s.whatsapp.net', '');
        if (clean.length === 13) {
            return `+${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 9)}-${clean.slice(9)}`;
        }
        return `+${clean}`;
    };

    const isConfigured = EvolutionApiService.isConfigured();

    if (!isConfigured) {
        return (
            <FeatureGate
                requiredPlan="pro"
                title="Conexão WhatsApp"
                description="Integre seu WhatsApp para enviar notificações automáticas aos clientes. Recurso disponível a partir do plano Pro."
            >
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <div className="flex items-start gap-4 p-6">
                        <div className="p-3 rounded-xl bg-yellow-500/20">
                            <WifiOff size={24} className="text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">WhatsApp Não Configurado</h3>
                            <p className="text-sm text-textMuted">
                                Configure as variáveis de ambiente <code className="text-yellow-400 bg-yellow-500/10 px-1 rounded">VITE_EVOLUTION_API_URL</code> e{' '}
                                <code className="text-yellow-400 bg-yellow-500/10 px-1 rounded">VITE_EVOLUTION_API_KEY</code> no arquivo <code>.env.local</code>.
                            </p>
                        </div>
                    </div>
                </Card>
            </FeatureGate>
        );
    }

    // STATE 1: No instance created yet — show activation card
    if (!instanceName) {
        return (
            <FeatureGate
                requiredPlan="pro"
                title="Conexão WhatsApp"
                description="Integre seu WhatsApp para enviar notificações automáticas aos clientes. Recurso disponível a partir do plano Pro."
            >
                <div className="space-y-6 animate-fade-in">
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
                        <div className="p-8 text-center">
                            <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                                <Smartphone size={40} className="text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">
                                Ative o WhatsApp da sua Barbearia
                            </h3>
                            <p className="text-textMuted mb-6 max-w-md mx-auto">
                                Conecte seu número de WhatsApp para enviar notificações automáticas de agendamento, lembretes e confirmações para seus clientes.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                <Button
                                    onClick={handleCreateInstance}
                                    disabled={creatingInstance}
                                    className="bg-green-600 hover:bg-green-700 text-white border-none px-8 py-3 text-lg"
                                >
                                    {creatingInstance ? (
                                        <><Loader2 size={20} className="mr-2 animate-spin" /> Criando instância...</>
                                    ) : (
                                        <><Plus size={20} className="mr-2" /> Ativar WhatsApp</>
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-textMuted mt-4">
                                Uma instância exclusiva será criada para <strong className="text-white">{organization?.name}</strong>
                            </p>
                        </div>
                    </Card>
                </div>
            </FeatureGate>
        );
    }

    // STATE 2 & 3: Instance exists — show connection status
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
                                Instância: <span className="text-white font-medium">{instanceName}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
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
                        {info?.connected && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                disabled={checking}
                                className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                            >
                                <WifiOff size={16} className="mr-2" />
                                Desconectar
                            </Button>
                        )}
                    </div>
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

                {/* Disconnected Warning & Connect Button */}
                {!loading && !info?.connected && (
                    <div className="px-6 py-4 border-t border-red-500/10 bg-red-500/5">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <p className="text-sm text-red-300/80">
                                ⚠️ WhatsApp desconectado. As notificações por WhatsApp não serão enviadas.
                                Clique em Conectar para gerar o QR Code.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleConnect()}
                                    disabled={loadingQr}
                                    className="whitespace-nowrap bg-green-600 hover:bg-green-700 text-white border-none"
                                >
                                    {loadingQr ? <Loader2 size={16} className="mr-2 animate-spin" /> : <QrCode size={16} className="mr-2" />}
                                    Conectar WhatsApp
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    disabled={reseting || loadingQr}
                                    className="border-white/10 text-textMuted hover:text-white"
                                >
                                    {reseting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
                                    Resetar Instância
                                </Button>
                            </div>
                        </div>
                        {qrCode && (
                            <div className="mt-6 flex flex-col items-center justify-center p-6 bg-white rounded-xl max-w-sm mx-auto animate-fade-in shadow-xl">
                                <h4 className="text-black font-bold mb-4 text-center">Escaneie o QR Code</h4>
                                <div className="p-2 border-4 border-gray-100 rounded-xl">
                                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                                </div>
                                <p className="text-gray-500 text-xs text-center mt-4">
                                    Abra o WhatsApp no seu celular {'>'} Aparelhos Conectados {'>'} Conectar um aparelho
                                </p>
                            </div>
                        )}
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
