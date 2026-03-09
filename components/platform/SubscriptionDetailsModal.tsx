import React, { useEffect, useState } from 'react';
import { X, Loader2, CreditCard, Calendar, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Organization } from '../../types';

interface SubscriptionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    organization: Organization | null;
}

export const SubscriptionDetailsModal: React.FC<SubscriptionDetailsModalProps> = ({
    isOpen,
    onClose,
    organization
}) => {
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && organization) {
            fetchDetails();
        }
    }, [isOpen, organization]);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/get-subscription?orgId=${organization!.id}`);
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Erro ao buscar detalhes');
            }
            
            setDetails(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !organization) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return '---';
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateString));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-xl animate-fade-in relative flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CreditCard className="text-primary" size={24} />
                        Detalhes do Pagamento
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    <h3 className="text-lg font-bold mb-1 text-white">{organization.name || 'Barbearia Sem Nome'}</h3>
                    <div className="flex items-center gap-2 text-sm mb-6">
                        <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                            {organization.slug}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="capitalize text-blue-400 font-medium">
                            Plano {organization.planType === 'enterprise' ? 'premium' : organization.planType}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="animate-spin text-primary mb-3" size={32} />
                            <p className="text-zinc-400 text-sm">Buscando informações no Mercado Pago...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 text-red-400">
                            <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : !details?.hasSubscription ? (
                        <div className="bg-zinc-800/50 p-6 rounded-xl text-center border border-zinc-800">
                            <Info className="mx-auto text-zinc-500 mb-3" size={32} />
                            <h4 className="font-bold text-white mb-2 text-lg">Sem Assinatura Vinculada</h4>
                            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                                {details?.message}
                            </p>
                            <div className="mt-6 pt-6 border-t border-zinc-800/50 flex justify-center gap-6 text-sm">
                                <p className="text-zinc-500">Status Local: <strong className="capitalize text-white">{details?.localStatus}</strong></p>
                                <p className="text-zinc-500">Plano Base: <strong className="capitalize text-white">{details?.planType === 'enterprise' ? 'premium' : details?.planType}</strong></p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">Status MP</p>
                                    <p className={`font-bold text-lg capitalize flex items-center gap-2 ${
                                        details.status === 'authorized' ? 'text-green-500' :
                                        details.status === 'paused' ? 'text-orange-500' :
                                        details.status === 'cancelled' ? 'text-red-500' : 'text-yellow-500'
                                    }`}>
                                        {details.status === 'authorized' && <CheckCircle size={18} />}
                                        {details.status}
                                    </p>
                                </div>
                                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">Valor Cobrado</p>
                                    <p className="font-bold text-lg text-white">
                                        <span className="text-zinc-400 text-sm font-normal mr-1">R$</span>
                                        {details.transaction_amount?.toFixed(2) || '0.00'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-zinc-800/30 p-5 rounded-xl border border-zinc-800/50 space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-3">
                                    <span className="text-zinc-400 flex items-center gap-2">
                                        <Calendar size={16} className="text-primary" /> Próxima Cobrança
                                    </span>
                                    <span className="font-bold text-white bg-zinc-800 px-3 py-1 rounded-full">{formatDate(details.next_payment_date)}</span>
                                </div>
                                
                                {details.last_charged_date && (
                                    <div className="flex justify-between items-center text-sm pb-1">
                                        <span className="text-zinc-500">Último Pagamento</span>
                                        <span className="text-zinc-300 font-medium">{formatDate(details.last_charged_date)}</span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-center text-sm pb-1">
                                    <span className="text-zinc-500">Assinatura Criada</span>
                                    <span className="text-zinc-300">{formatDate(details.date_created)}</span>
                                </div>
                                
                                {details.payer_email && (
                                    <div className="flex justify-between items-center text-sm pt-1">
                                        <span className="text-zinc-500">E-mail Pagador</span>
                                        <span className="text-zinc-300 truncate max-w-[200px]" title={details.payer_email}>{details.payer_email}</span>
                                    </div>
                                )}
                            </div>

                            {details.free_trial && (
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 text-blue-500/10 transform rotate-12">
                                        <Info size={100} />
                                    </div>
                                    <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2 relative z-10">
                                        <Info size={16} /> Período de Teste Ativo (Trial)
                                    </h4>
                                    <p className="text-blue-200/70 text-sm relative z-10">
                                        Acesso gratuito configurado para {details.free_trial.frequency} {details.free_trial.frequency_type}(s). 
                                        A primeira cobrança ocorrerá após este período.
                                    </p>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* Footer */}
                 <div className="p-4 border-t border-zinc-800 shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
