import React, { useState } from 'react';
import { Megaphone, QrCode, Target, Share2, Rocket, Users, Calendar, MessageSquare, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { BarberQRCode } from '../BarberQRCode';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Role } from '../../types';
import { useInactiveCustomers } from '../../hooks/useInactiveCustomers';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { NotificationService } from '../../services/NotificationService';
import { format, parseISO } from 'date-fns';

export const AdminMarketing: React.FC = () => {
    const { user, profile } = useAuth();
    const { organization } = useOrganization();
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    
    const { inactiveCustomers, isLoading } = useInactiveCustomers(organization?.id);
    
    if (!organization) return null;

    const toggleCustomer = (id: string) => {
        setSelectedCustomers(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleSendBatch = async () => {
        if (selectedCustomers.length === 0) {
            toast.error("Selecione pelo menos um cliente.");
            return;
        }

        if (!organization.whatsappInstanceName || !organization.whatsappConnected) {
            toast.error("O WhatsApp precisa estar conectado para enviar campanhas.");
            return;
        }

        setIsSending(true);
        try {
            const batch = inactiveCustomers
                .filter(c => selectedCustomers.includes(c.id) && c.phone)
                .map(c => ({
                    phone: c.phone!,
                    text: `Olá ${c.name.split(' ')[0]}! Tudo bem? Notamos que faz um tempo (${c.daysInactive} dias) que você não nos visita. Que tal agendar um horário para renovar o visual? ✂️\n\nAgende aqui: ${window.location.origin}/${organization.slug}`
                }));

            const result = await NotificationService.sendMarketingBatch(organization.whatsappInstanceName, batch);
            
            if (result.success) {
                toast.success(`${result.successCount} mensagens enviadas com sucesso!`);
                setSelectedCustomers([]);
            } else {
                toast.error("Falha ao enviar mensagens.");
            }
        } catch (error) {
            console.error("Marketing batch error:", error);
            toast.error("Erro ao processar envio.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Marketing e Crescimento</h1>
                    <p className="text-zinc-400">Ferramentas para atrair e fidelizar seus clientes.</p>
                </div>
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full">
                    <Rocket size={18} className="text-yellow-500" />
                    <span className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Modo Pro Ativo</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: QR Code & Tips */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <QrCode size={24} className="text-yellow-500" />
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">QR Code</h2>
                    </div>
                    {user && profile && (
                        <BarberQRCode 
                            slug={organization.slug}
                            barberId={user.id}
                            barberName={profile.name || 'Seu Nome'}
                            primaryColor={organization.primaryColor}
                        />
                    )}
                    
                    <Card className="bg-zinc-900 border-zinc-800 p-6">
                        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Target size={18} className="text-blue-500" />
                            Dica de Marketing
                        </h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Clientes que agendam diretamente na cadeira do barbeiro têm <strong>3x mais chances</strong> de se tornarem recorrentes. 
                        </p>
                    </Card>
                </div>

                {/* Right Column: Saudade Campaign */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Megaphone size={24} className="text-yellow-500" />
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Campanha Saudade</h2>
                        </div>
                        {selectedCustomers.length > 0 && (
                            <Button 
                                onClick={handleSendBatch} 
                                disabled={isSending}
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isSending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                                Enviar para {selectedCustomers.length}
                            </Button>
                        )}
                    </div>
                    
                    <Card className="bg-zinc-900 border-zinc-800">
                        <div className="p-6 border-b border-white/5 bg-white/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Clientes "Sumidos" (+30 dias)</h3>
                                    <p className="text-xs text-zinc-400">Identificamos clientes que gostam do seu serviço mas estão demorando a voltar.</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-display font-bold text-primary">{inactiveCustomers.length}</span>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Clientes Alvo</p>
                                </div>
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="p-12 flex flex-col items-center justify-center text-zinc-600">
                                    <Loader2 size={32} className="animate-spin mb-4" />
                                    <p>Analisando histórico de frequência...</p>
                                </div>
                            ) : inactiveCustomers.length === 0 ? (
                                <div className="p-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h4 className="text-white font-bold mb-1">Tudo em dia!</h4>
                                    <p className="text-sm text-zinc-500">Não encontramos clientes inativos no momento.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {inactiveCustomers.map((customer) => (
                                        <div 
                                            key={customer.id} 
                                            className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer ${selectedCustomers.includes(customer.id) ? 'bg-primary/5' : ''}`}
                                            onClick={() => toggleCustomer(customer.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCustomers.includes(customer.id) ? 'bg-primary border-primary' : 'border-zinc-700'}`}>
                                                    {selectedCustomers.includes(customer.id) && <CheckCircle2 size={12} className="text-black" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{customer.name}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] flex items-center gap-1 text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                                                            <Calendar size={10} /> Último: {format(parseISO(customer.lastAppointmentDate), 'dd/MM/yy')}
                                                        </span>
                                                        <span className="text-[10px] flex items-center gap-1 text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                                                            <Users size={10} /> {customer.lastService}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-red-400">{customer.daysInactive} dias</span>
                                                <p className="text-[10px] text-zinc-600 uppercase font-bold">Sem Visita</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Pro Features Placeholders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-zinc-800/30 border-zinc-800 p-6 flex items-start gap-4">
                            <div className="p-3 bg-zinc-800 rounded-xl text-zinc-500">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Promoções Relâmpago</h4>
                                <p className="text-xs text-zinc-500">Dispare cupons para horários de baixa demanda.</p>
                                <div className="mt-2 text-[10px] text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded inline-block uppercase font-bold">Em Breve</div>
                            </div>
                        </Card>
                        <Card className="bg-zinc-800/30 border-zinc-800 p-6 flex items-start gap-4">
                            <div className="p-3 bg-zinc-800 rounded-xl text-zinc-500">
                                <Share2 size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Link de Programas</h4>
                                <p className="text-xs text-zinc-500">Crie links personalizados para influencers.</p>
                                <div className="mt-2 text-[10px] text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded inline-block uppercase font-bold">Em Breve</div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
