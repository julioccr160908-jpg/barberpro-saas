import React, { useState, useMemo } from 'react';
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
    Loader2,
    TrendingUp,
    TrendingDown,
    Info,
    ChevronDown,
    Pause,
    RefreshCw,
    History,
    List,
    DollarSign
} from 'lucide-react';
import { format, parseISO, startOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminSubscriptions: React.FC = () => {
    const { organization } = useOrganization();
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
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

    // Stats / BI Intelligence
    const stats = useMemo(() => {
        const activeMembers = memberships.filter(m => m.status === 'active');
        const mrr = activeMembers.reduce((sum, m) => sum + (m.plan?.price || 0), 0);
        
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        
        const newThisMonth = memberships.filter(sub => {
            if (!sub.created_at) return false;
            return isWithinInterval(parseISO(sub.created_at), { start: startOfCurrentMonth, end: now });
        }).length;

        const growthRate = memberships.length > 0 
            ? Math.round((newThisMonth / memberships.length) * 100)
            : 0;

        const delinquency = memberships.filter(m => m.status === 'past_due').length;

        return { mrr, total: memberships.length, growthRate, delinquency };
    }, [memberships]);

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

            {/* Header Stats / BI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-surface/50 border-white/5 relative overflow-hidden group">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Recorrência (MRR)</span>
                        <h3 className="text-3xl font-display font-bold text-white">R$ {stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <div className="flex items-center gap-1.5 mt-2 text-green-500 bg-green-500/10 w-fit px-2 py-0.5 rounded-full border border-green-500/20">
                            <DollarSign size={10} />
                            <span className="text-[10px] font-bold">ATIVA</span>
                        </div>
                    </div>
                    <TrendingUp size={48} className="absolute -bottom-2 -right-2 text-primary opacity-5 group-hover:scale-110 transition-transform duration-500" />
                </Card>

                <Card className="p-6 bg-surface/50 border-white/5 relative overflow-hidden group">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total de Assinantes</span>
                        <h3 className="text-3xl font-display font-bold text-white">{stats.total}</h3>
                        <div className="flex items-center gap-1.5 mt-2 text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-full border border-primary/20">
                            <TrendingUp size={10} />
                            <span className="text-[10px] font-bold">+{stats.growthRate}% este mês</span>
                        </div>
                    </div>
                    <Users size={48} className="absolute -bottom-2 -right-2 text-primary opacity-5 group-hover:scale-110 transition-transform duration-500" />
                </Card>

                <Card className="p-6 bg-surface/50 border-white/5 relative overflow-hidden group">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Inadimplência</span>
                        <h3 className="text-3xl font-display font-bold text-white">{stats.delinquency}</h3>
                        <div className={`flex items-center gap-1.5 mt-2 w-fit px-2 py-0.5 rounded-full border ${stats.delinquency > 0 ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'}`}>
                            {stats.delinquency > 0 ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                            <span className="text-[10px] font-bold uppercase">{stats.delinquency > 0 ? 'ATENÇÃO' : 'OK'}</span>
                        </div>
                    </div>
                    <TrendingDown size={48} className="absolute -bottom-2 -right-2 text-red-500 opacity-5 group-hover:scale-110 transition-transform duration-500" />
                </Card>
            </div>

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
                            <Card key={plan.id} className="bg-surface/50 border-white/5 p-6 group hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => deletePlanMutation.mutate(plan.id)}
                                        className="text-zinc-600 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-white tracking-tight">{plan.name}</h3>
                                        {plan.description && (
                                            <div className="group/info relative">
                                                <List size={14} className="text-zinc-600 cursor-help hover:text-primary transition-colors" />
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-zinc-900 border border-white/10 rounded-lg text-[10px] text-zinc-400 invisible group-hover/info:visible animate-in fade-in zoom-in duration-200 z-50 shadow-2xl">
                                                    {plan.description}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-3xl font-display font-black text-primary">
                                        R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        <span className="text-xs text-zinc-500 ml-1 font-sans font-medium uppercase tracking-widest italic opacity-50">/{plan.interval === 'month' ? 'mês' : 'sem'}</span>
                                    </p>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" /> Ativo</span>
                                    <span className="flex items-center gap-1 text-zinc-400">
                                        <Users size={12} className="text-primary/50" /> {memberships.filter(m => m.plan_id === plan.id).length} MESTRES
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
                                        <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-white text-sm tracking-tight">{sub.customer?.name}</p>
                                                <p className="text-[10px] text-zinc-500 font-mono">{sub.customer?.phone}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-white/5 whitespace-nowrap">
                                                    {sub.plan?.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px] ${
                                                        sub.status === 'active' ? 'bg-green-500 shadow-green-500/40' : 
                                                        sub.status === 'past_due' ? 'bg-red-500 shadow-red-500/40' : 
                                                        'bg-yellow-500 shadow-yellow-500/40 animate-pulse'
                                                    }`} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                                        sub.status === 'active' ? 'text-green-500' : 
                                                        sub.status === 'past_due' ? 'text-red-500' : 
                                                        'text-yellow-500'
                                                    }`}>
                                                        {sub.status === 'active' ? 'PAGO' : sub.status === 'past_due' ? 'FALHA' : 'PROCESSANDO'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-zinc-400 group-hover:text-white transition-colors">
                                                    <Calendar size={12} className="text-zinc-600" />
                                                    {format(parseISO(sub.next_billing_date), 'dd/MM/yyyy')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className={`h-8 text-[10px] border-zinc-800 gap-2 font-bold uppercase tracking-widest transition-all ${activeMenu === sub.id ? 'bg-white/10 text-white border-white/20' : ''}`}
                                                        onClick={() => setActiveMenu(activeMenu === sub.id ? null : sub.id)}
                                                    >
                                                        Ações <ChevronDown size={12} className={`transition-transform duration-300 ${activeMenu === sub.id ? 'rotate-180' : ''}`} />
                                                    </Button>
                                                    
                                                    {activeMenu === sub.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                                            <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                                <button className="w-full px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                                                                    <Pause size={14} className="text-zinc-600" /> Pausar Assinatura
                                                                </button>
                                                                <button className="w-full px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors border-t border-white/5">
                                                                    <RefreshCw size={14} className="text-zinc-600" /> Trocar Plano
                                                                </button>
                                                                <button className="w-full px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors border-t border-white/5">
                                                                    <History size={14} className="text-zinc-600" /> Histórico
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
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
