import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { SubscriptionPlan, CustomerSubscription } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import { 
    CreditCard, 
    Plus, 
    Trash2, 
    Users, 
    Settings, 
    Calendar, 
    CheckCircle2, 
    AlertCircle,
    Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminSubscriptions: React.FC = () => {
    const { organization } = useOrganization();
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newPlan, setNewPlan] = useState<Partial<SubscriptionPlan>>({
        name: '',
        price: 0,
        interval: 'month',
        description: ''
    });

    // Fetch Plans
    const { data: plans = [], isLoading: loadingPlans } = useQuery({
        queryKey: ['subscription-plans', organization?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('organization_id', organization?.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as SubscriptionPlan[];
        },
        enabled: !!organization?.id
    });

    // Fetch Active Memberships
    const { data: memberships = [], isLoading: loadingMemberships } = useQuery({
        queryKey: ['customer-subscriptions', organization?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('customer_subscriptions')
                .select(`
                    *,
                    plan:plan_id(*),
                    customer:profiles!customer_id(name, phone)
                `)
                .eq('organization_id', organization?.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as CustomerSubscription[];
        },
        enabled: !!organization?.id
    });

    const createPlanMutation = useMutation({
        mutationFn: async (plan: Partial<SubscriptionPlan>) => {
            const { error } = await supabase
                .from('subscription_plans')
                .insert([{ ...plan, organization_id: organization?.id }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            toast.success("Plano de assinatura criado!");
            setIsAdding(false);
            setNewPlan({ name: '', price: 0, interval: 'month', description: '' });
        },
        onError: (error) => {
            toast.error("Erro ao criar plano.");
            console.error(error);
        }
    });

    const deletePlanMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('subscription_plans')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            toast.success("Plano removido.");
        }
    });

    const handleCreatePlan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlan.name || !newPlan.price) return;
        createPlanMutation.mutate(newPlan);
    };

    if (!organization) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Clube de Assinatura</h1>
                    <p className="text-zinc-400">Crie planos recorrentes e fidelize seus clientes com receita garantida.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsAdding(true)} className="bg-primary text-black hover:bg-primary/90">
                        <Plus size={18} className="mr-2" />
                        Novo Plano
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Plans List */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings size={20} className="text-primary" />
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Planos Ativos</h2>
                    </div>

                    {isAdding && (
                        <Card className="bg-zinc-900 border-primary/30 p-6 animate-in slide-in-from-top-4 duration-300">
                            <form onSubmit={handleCreatePlan} className="space-y-4">
                                <h3 className="text-lg font-bold text-white">Criar Novo Plano</h3>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Nome do Plano</label>
                                    <Input 
                                        placeholder="Ex: Corte Ilimitado" 
                                        value={newPlan.name}
                                        onChange={e => setNewPlan({...newPlan, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Preço Mensal</label>
                                        <Input 
                                            type="number" 
                                            placeholder="0,00" 
                                            value={newPlan.price}
                                            onChange={e => setNewPlan({...newPlan, price: Number(e.target.value)})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Intervalo</label>
                                        <select 
                                            className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2 text-white text-sm"
                                            value={newPlan.interval}
                                            onChange={e => setNewPlan({...newPlan, interval: e.target.value})}
                                        >
                                            <option value="month">Mensal</option>
                                            <option value="week">Semanal</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Descrição (Opcional)</label>
                                    <textarea 
                                        className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2 text-white text-sm"
                                        placeholder="O que está incluso?"
                                        value={newPlan.description}
                                        onChange={e => setNewPlan({...newPlan, description: e.target.value})}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="flex-1" disabled={createPlanMutation.isPending}>
                                        {createPlanMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                                        Salvar Plano
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="border-zinc-800">Cancelar</Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {loadingPlans ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                    ) : plans.length === 0 && !isAdding ? (
                        <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
                            <CreditCard size={48} className="text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-500">Nenhum plano de assinatura criado ainda.</p>
                        </Card>
                    ) : (
                        plans.map(plan => (
                            <Card key={plan.id} className="bg-zinc-900 border-zinc-800 p-6 group hover:border-primary/30 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                        <p className="text-2xl font-display font-bold text-primary mt-1">
                                            R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            <span className="text-xs text-zinc-500 ml-1 font-sans">/{plan.interval === 'month' ? 'mês' : 'semana'}</span>
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => deletePlanMutation.mutate(plan.id)}
                                        className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                {plan.description && <p className="text-sm text-zinc-500 line-clamp-2">{plan.description}</p>}
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 font-bold uppercase tracking-wider">
                                    <span>Status: <span className="text-green-500">Ativo</span></span>
                                    <span className="flex items-center gap-1">
                                        <Users size={12} /> {memberships.filter(m => m.plan_id === plan.id).length} Assinantes
                                    </span>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Subscribers List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={20} className="text-primary" />
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Assinantes do Clube</h2>
                    </div>

                    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Gestão de Membros</h3>
                                    <p className="text-xs text-zinc-400">Acompanhe o status e pagamentos recorrentes dos seus clientes.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-2xl font-display font-bold text-white">{memberships.length}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Total</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-display font-bold text-green-500">{memberships.filter(m => m.status === 'active').length}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Ativos</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-800/30 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Cliente</th>
                                        <th className="px-6 py-4">Plano</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Próximo Cobrança</th>
                                        <th className="px-6 py-4">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loadingMemberships ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-zinc-600"><Loader2 className="animate-spin mx-auto" /></td></tr>
                                    ) : memberships.length === 0 ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-zinc-500">Nenhum assinante cadastrado ainda.</td></tr>
                                    ) : memberships.map(sub => (
                                        <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-white text-sm">{sub.customer?.name}</p>
                                                <p className="text-xs text-zinc-500">{sub.customer?.phone}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded font-bold uppercase">
                                                    {sub.plan?.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {sub.status === 'active' ? (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-green-500 bg-green-500/10 px-2 py-1 rounded">
                                                            <CheckCircle2 size={10} /> Ativo
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                                                            <AlertCircle size={10} /> Pendente
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                    <Calendar size={14} className="text-zinc-600" />
                                                    {format(parseISO(sub.next_billing_date), 'dd/MM/yyyy')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button size="sm" variant="outline" className="h-8 text-[10px] border-zinc-800">
                                                    Detalhes
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
