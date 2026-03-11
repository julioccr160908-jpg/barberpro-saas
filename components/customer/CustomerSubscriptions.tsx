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

    const isLoading = authLoading || isOrgLoading || isSettingsLoading || loadingPlans;

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
                <h2 className="text-2xl font-bold text-white mb-2">Clube de Assinatura</h2>
                <p className="text-textMuted">Escolha um plano e aproveite benefícios exclusivos com economia.</p>
            </header>

            {plans.length === 0 ? (
                <Card className="p-12 text-center bg-surface border-zinc-800">
                    <CreditCard size={48} className="mx-auto text-textMuted mb-4 opacity-30" />
                    <p className="text-textMuted italic">Ainda não temos planos ativos. Volte em breve!</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <Card key={plan.id} className="relative overflow-hidden flex flex-col border-zinc-800 group hover:border-primary/50 transition-all duration-300">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: settings.primary_color }} />
                            
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 rounded-lg bg-zinc-800 text-primary">
                                        <Sparkles size={20} style={{ color: settings.primary_color }} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-tighter bg-primary/10 px-2 py-1 rounded text-primary" style={{ color: settings.primary_color, backgroundColor: `${settings.primary_color}1a` }}>
                                        Recomendado
                                    </span>
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
                                    style={{ backgroundColor: settings.primary_color }}
                                    className="hover:scale-[1.02] active:scale-[0.98] transition-transform"
                                >
                                    <MessageSquare size={18} className="mr-2" />
                                    Assinar Agora
                                </Button>
                                <p className="text-[10px] text-center text-zinc-500 mt-4 uppercase font-bold tracking-widest">
                                    Pagamento recorrente seguro
                                </p>
                            </div>
                        </Card>
                    ))}
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
