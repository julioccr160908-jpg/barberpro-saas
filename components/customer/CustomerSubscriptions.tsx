import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import { SubscriptionPlan } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CreditCard, Check, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { useSettingsQuery } from '../../hooks/useSettingsQuery';

export const CustomerSubscriptions: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const { data: org, isLoading: isOrgLoading } = useOrganization();
    const orgId = org?.id;

    const { data: settingsData, isLoading: isSettingsLoading } = useSettingsQuery(orgId);

    // Fetch User's Active Subscription
    const { data: activeSubscription, isLoading: loadingSubscription } = useQuery({
        queryKey: ['user-active-subscription', user?.id, orgId],
        queryFn: async () => {
            if (!user?.id || !orgId) return null;
            const { data, error } = await supabase
                .from('customer_subscriptions')
                .select(`
                    *,
                    plan:subscription_plans(*)
                `)
                .eq('customer_id', user.id)
                .eq('organization_id', orgId)
                .neq('status', 'cancelled') // Check for active or pending
                .maybeSingle();

            if (error) {
                console.error('Error fetching user subscription:', error);
                return null;
            }
            return data;
        },
        enabled: !!user?.id && !!orgId
    });

    // Fetch Active Plans
    const { data: plans = [], isLoading: loadingPlans } = useQuery({
        queryKey: ['public-subscription-plans', orgId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('organization_id', orgId)
                .eq('is_active', true)
                .order('price', { ascending: true });
            if (error) throw error;
            return data as SubscriptionPlan[];
        },
        enabled: !!orgId
    });

    const isLoading = authLoading || isOrgLoading || isSettingsLoading || loadingPlans || loadingSubscription;
    const [isSubscribing, setIsSubscribing] = React.useState(false);

    const settings = useMemo(() => ({
        primary_color: org?.primary_color || settingsData?.primary_color || '#D4AF37',
        establishment_name: settingsData?.establishment_name || 'Barbearia',
        phone: settingsData?.phone || ''
    }), [org, settingsData]);

    const navigate = useNavigate();

    const handleSubscribe = async (plan: SubscriptionPlan) => {
        if (!user) {
            toast.error('Você precisa estar logado para assinar.');
            return;
        }

        if (activeSubscription) {
            toast.info('Você já possui uma assinatura ativa ou pendente.');
            return;
        }

        setIsSubscribing(true);

        try {
            // 1. Create a pending subscription record
            const { data, error } = await supabase
                .from('customer_subscriptions')
                .insert([{
                    customer_id: user.id,
                    plan_id: plan.id,
                    organization_id: orgId,
                    status: 'pending',
                    next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            const subscriptionId = data.id;

            // 2. Redirect to Mock Payment Page with metadata
            const params = new URLSearchParams({
                amount: plan.price.toString(),
                title: `Assinatura: ${plan.name}`,
                subscription_id: subscriptionId,
                type: 'subscription'
            });

            navigate(`/checkout/mock?${params.toString()}`);
        } catch (error) {
            console.error('Error initiating subscription:', error);
            toast.error('Erro ao iniciar assinatura. Tente novamente.');
        } finally {
            setIsSubscribing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-primary w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Clube de Assinatura</h2>
                        <p className="text-textMuted">Aproveite benefícios exclusivos e garanta seu visual em dia.</p>
                    </div>
                </div>
            </header>

            {activeSubscription && (
                <Card className={`p-6 border-primary/30 relative overflow-hidden animate-in fade-in slide-in-from-top duration-500 ${activeSubscription.status === 'active' ? 'bg-primary/5' : 'bg-orange-500/5 border-orange-500/30'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${activeSubscription.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-orange-500/20 text-orange-500'}`}>
                                <Sparkles size={24} style={activeSubscription.status === 'active' ? { color: settings.primary_color } : {}} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white leading-tight">
                                    {activeSubscription.status === 'active' ? 'Sua Assinatura está Ativa!' : 'Assinatura em Processamento'}
                                </h3>
                                <p className="text-sm text-textMuted mt-1">
                                    {activeSubscription.status === 'active' ? (
                                        <>Você está no plano <span className="text-white font-medium">{(activeSubscription as any).plan?.name}</span></>
                                    ) : (
                                        'Aguardando confirmação de pagamento'
                                    )}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-start md:items-end">
                            <div className={`flex items-center gap-2 font-bold text-sm mb-1 ${activeSubscription.status === 'active' ? 'text-primary' : 'text-orange-500'}`} style={activeSubscription.status === 'active' ? { color: settings.primary_color } : {}}>
                                {activeSubscription.status === 'active' ? <><Check size={16} /> Próxima renovação</> : <><Loader2 size={16} className="animate-spin" /> Verificando status</>}
                            </div>
                            <p className="text-white font-display text-lg">
                                {new Date((activeSubscription as any).next_billing_date).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {plans.length === 0 ? (
                <Card className="p-12 text-center bg-surface border-zinc-800">
                    <CreditCard size={48} className="mx-auto text-textMuted mb-4 opacity-30" />
                    <p className="text-textMuted italic">Ainda não temos planos ativos. Volte em breve!</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => {
                        const isCurrentPlan = activeSubscription && (activeSubscription as any).plan_id === plan.id;
                        
                        return (
                            <Card key={plan.id} className={`relative overflow-hidden flex flex-col border-zinc-800 group transition-all duration-300 ${isCurrentPlan ? 'ring-2 ring-primary/50' : 'hover:border-primary/50'}`}>
                                {/* Accent line */}
                                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: isCurrentPlan ? settings.primary_color : '#3f3f46' }} />
                                
                                {isCurrentPlan && (
                                    <div className="absolute top-4 right-4 z-20">
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold text-black uppercase tracking-wide ${activeSubscription.status === 'active' ? 'bg-primary' : 'bg-orange-500'}`} style={activeSubscription.status === 'active' ? { backgroundColor: settings.primary_color } : {}}>
                                            {activeSubscription.status === 'active' ? <><Check size={10} /> Seu Plano</> : 'Pendente'}
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 rounded-lg bg-zinc-800 text-primary">
                                            <Sparkles size={20} style={{ color: settings.primary_color }} />
                                        </div>
                                        {!isCurrentPlan && (
                                            <span className="text-xs font-bold uppercase tracking-wide bg-primary/10 px-2 py-1 rounded text-primary" style={{ color: settings.primary_color, backgroundColor: `${settings.primary_color}1a` }}>
                                                Recomendado
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-3xl font-display font-bold text-white">R$ {plan.price.toFixed(2)}</span>
                                        <span className="text-textMuted text-xs">/{plan.interval === 'month' ? 'mês' : 'semana'}</span>
                                    </div>

                                    {plan.description && (
                                        <div className="space-y-3 mb-8">
                                            {plan.description.split('\n').filter(line => line.trim()).map((line, idx) => (
                                                <div key={idx} className="flex items-start gap-3">
                                                    <div className="mt-1 flex-shrink-0">
                                                        <Check size={14} style={{ color: settings.primary_color }} />
                                                    </div>
                                                    <p className="text-sm text-zinc-300 leading-relaxed">{line}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-zinc-900/50 border-t border-white/5">
                                    <Button 
                                        fullWidth 
                                        onClick={() => handleSubscribe(plan)}
                                        disabled={!!activeSubscription || isSubscribing}
                                        style={{ backgroundColor: isCurrentPlan ? '#27272a' : settings.primary_color, opacity: activeSubscription && !isCurrentPlan ? 0.5 : 1 }}
                                        className="hover:scale-[1.02] active:scale-[0.98] transition-transform"
                                    >
                                        {isSubscribing ? (
                                            <Loader2 className="animate-spin" />
                                        ) : isCurrentPlan ? (
                                            activeSubscription.status === 'active' ? 'Plano Ativo' : 'Pendente'
                                        ) : activeSubscription ? (
                                            'Já possui plano'
                                        ) : (
                                            'Assinar Agora'
                                        )}
                                    </Button>
                                    <p className="text-xs text-center text-zinc-500 mt-4 uppercase font-semibold tracking-wide">
                                        Pagamento recorrente seguro
                                    </p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-primary/10 rounded-full" style={{ backgroundColor: `${settings.primary_color}1a` }}>
                    <CreditCard size={32} style={{ color: settings.primary_color }} />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="font-bold text-white mb-1">Como funciona?</h4>
                    <p className="text-sm text-textMuted">Nossas assinaturas garantem que você tenha seu visual sempre em dia com um valor fixo mensal. Sem surpresas, com prioridade de agendamento e economia real.</p>
                </div>
            </div>
        </div>
    );
};
