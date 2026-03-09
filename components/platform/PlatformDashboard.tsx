import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Users, Building2, DollarSign, TrendingUp, AlertCircle, PieChart as PieChartIcon, Activity, Trophy, CheckCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Organization } from '../../types';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

export const PlatformDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalOrgs: 0,
        activeUsers: 0,
        mrr: 0,
        churnRate: 0
    });
    const [recentOrgs, setRecentOrgs] = useState<Organization[]>([]);
    const [topOrgs, setTopOrgs] = useState<(Organization & { memberCount: number })[]>([]);
    const [systemAlerts, setSystemAlerts] = useState<{ id: string, message: string, details?: string[], type: 'warning' | 'error' | 'info', icon: React.ElementType }[]>([]);
    
    // Chart data state
    const [planDistribution, setPlanDistribution] = useState<{name: string, value: number}[]>([]);
    const [mrrHistory, setMrrHistory] = useState<{name: string, mrr: number}[]>([]);
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Total Organizations
            const { count: orgCount, data: orgsData } = await supabase
                .from('organizations')
                .select('*', { count: 'exact' });

            // 2. Profiles (For Top Clients and count)
            const { data: allProfiles } = await supabase
                .from('profiles')
                .select('id, organization_id, role');

            const userCount = allProfiles?.length || 0;

            // 3. Recent Organizations (limit 3)
            const { data: recent } = await supabase
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            // Calculate Top Clients by Profile count
            if (orgsData && allProfiles) {
                const orgCounts: Record<string, number> = {};
                allProfiles.forEach(p => {
                    if (p.organization_id) {
                        orgCounts[p.organization_id] = (orgCounts[p.organization_id] || 0) + 1;
                    }
                });

                const ranked = orgsData
                    .map(org => ({ ...org, memberCount: orgCounts[org.id] || 0 }))
                    .sort((a, b) => b.memberCount - a.memberCount)
                    .slice(0, 5);
                setTopOrgs(ranked as any);

                // Calculate System Alerts
                const newAlerts: any[] = [];
                
                // Risk of Churn
                const pastDueOrgs = orgsData.filter(o => o.subscription_status === 'past_due');
                if (pastDueOrgs.length > 0) {
                    newAlerts.push({
                        id: 'past-due',
                        message: `${pastDueOrgs.length} barbearia(s) com pagamento atrasado (risco de churn).`,
                        details: pastDueOrgs.map(o => o.name || 'Barbearia Sem Nome'),
                        type: 'error',
                        icon: AlertCircle
                    });
                }
                
                // Trials finishing soon or just trial
                const trialOrgs = orgsData.filter(o => o.subscription_status === 'trial');
                if (trialOrgs.length > 0) {
                    newAlerts.push({
                        id: 'trial',
                        message: `${trialOrgs.length} barbearia(s) em período de teste grátis no momento.`,
                        details: trialOrgs.map(o => o.name || 'Barbearia Sem Nome'),
                        type: 'info',
                        icon: Building2
                    });
                }

                // WhatsApp disconnected
                const offlineWhatsappOrgs = orgsData.filter(o => o.whatsapp_instance_name && o.whatsapp_connected === false);
                if (offlineWhatsappOrgs.length > 0) {
                    newAlerts.push({
                        id: 'whatsapp-offline',
                        message: `${offlineWhatsappOrgs.length} integração(ões) de WhatsApp estão desconectadas.`,
                        details: offlineWhatsappOrgs.map(o => o.name || 'Barbearia Sem Nome'),
                        type: 'warning',
                        icon: AlertCircle
                    });
                }
                
                setSystemAlerts(newAlerts);
            }

            // Calculate MRR based on actual plan prices
            const activeOrgs = orgsData?.filter(o => o.subscription_status === 'active' || o.subscription_status === 'trial') || [];
            
            const PLAN_PRICES = {
                basic: 34.99,
                pro: 49.99,
                premium: 74.99,
                enterprise: 97.00 // Legacy mapping
            };

            const estimatedMrr = activeOrgs.reduce((total, org) => {
                const planType = (org.plan_type || 'basic').toLowerCase() as keyof typeof PLAN_PRICES;
                return total + (PLAN_PRICES[planType] || 0);
            }, 0);

            // Calculate Plan Distribution for Pie Chart
            const distribution = {
                Basic: 0,
                Pro: 0,
                Premium: 0
            };
            
            activeOrgs.forEach(org => {
                let plan = (org.plan_type || 'basic').toLowerCase();
                if (plan === 'enterprise') plan = 'premium';
                
                if (plan === 'basic') distribution.Basic++;
                else if (plan === 'pro') distribution.Pro++;
                else if (plan === 'premium') distribution.Premium++;
            });

            setPlanDistribution(
                Object.entries(distribution)
                    .filter(([_, count]) => count > 0)
                    .map(([name, count]) => ({ name, value: count }))
            );

            // Simulate MRR History over last 6 months (cumulative creation)
            if (activeOrgs.length > 0) {
                const history = [];
                for (let i = 5; i >= 0; i--) {
                    const monthDate = subMonths(new Date(), i);
                    const monthStart = startOfMonth(monthDate);
                    
                    // Sum MRR of orgs created before the end of this month
                    const currentMonthOrgs = activeOrgs.filter(org => new Date(org.created_at) <= monthDate);
                    const monthMrr = currentMonthOrgs.reduce((total, org) => {
                        let plan = (org.plan_type || 'basic').toLowerCase();
                        if (plan === 'enterprise') plan = 'premium';
                        return total + (PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || 0);
                    }, 0);

                    history.push({
                        name: format(monthDate, 'MMM', { locale: ptBR }),
                        mrr: monthMrr
                    });
                }
                setMrrHistory(history);
            }

            setStats({
                totalOrgs: orgCount || 0,
                activeUsers: userCount || 0,
                mrr: estimatedMrr,
                churnRate: 0 // Need historical data for this
            });

            if (recent) setRecentOrgs(recent as any);

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Visão Geral da Plataforma</h1>
            <p className="text-zinc-400 mb-8">Dados em tempo real do BarberHost.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total de Barbearias"
                    value={loading ? "..." : stats.totalOrgs.toString()}
                    trend="Base atual"
                    icon={Building2}
                    color="text-blue-400"
                />
                <StatCard
                    title="Usuários na Plataforma"
                    value={loading ? "..." : stats.activeUsers.toString()}
                    trend="Total de perfis"
                    icon={Users}
                    color="text-green-400"
                />
                <StatCard
                    title="Receita Estimada (MRR)"
                    value={loading ? "..." : `R$ ${stats.mrr.toFixed(2)}`}
                    trend="Baseado em ativos"
                    icon={DollarSign}
                    color="text-yellow-400"
                />
                <StatCard
                    title="Taxa de Cancelamento"
                    value="0%"
                    trend="Sem dados históricos"
                    isNegative
                    icon={TrendingUp}
                    color="text-red-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-6 p-1">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <PieChartIcon size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Distribuição de Planos</h3>
                            <p className="text-sm text-zinc-500">Divisão da base de clientes ativos</p>
                        </div>
                    </div>
                    
                    <div className="h-64">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-zinc-500">Carregando...</div>
                        ) : planDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={planDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {planDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-500">Sem dados suficientes</div>
                        )}
                    </div>
                    
                    {!loading && planDistribution.length > 0 && (
                        <div className="flex items-center justify-center gap-6 mt-4 border-t border-zinc-800 py-4">
                            {planDistribution.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-sm text-zinc-300 capitalize">{entry.name}</span>
                                    <span className="text-sm font-bold text-white">({entry.value})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-6 p-1">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Evolução do Faturamento</h3>
                            <p className="text-sm text-zinc-500">Receita Recorrente Mensal (MRR)</p>
                        </div>
                    </div>
                    
                    <div className="h-64 mt-4">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-zinc-500">Carregando...</div>
                        ) : mrrHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={mrrHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis 
                                        stroke="#71717a" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(value) => `R$${value}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'MRR']}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="mrr" 
                                        stroke="#10b981" 
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#fff', stroke: '#10b981' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-500">Sem dados suficientes</div>
                        )}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="h-full bg-zinc-900 border-zinc-800">
                    <div className="flex items-center justify-between mb-4 p-4 pb-0">
                        <h3 className="text-lg font-bold text-white">Ranking de Uso</h3>
                        <div className="flex items-center gap-2 text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                            <Trophy size={14} />
                            Top Clientes
                        </div>
                    </div>
                    <div className="p-4 pt-2 space-y-3">
                        {loading ? (
                            <p className="text-zinc-500 text-sm">Carregando...</p>
                        ) : topOrgs.map((org, idx) => (
                            <div key={org.id} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                                        idx === 1 ? 'bg-zinc-300/20 text-zinc-300' :
                                        idx === 2 ? 'bg-amber-600/20 text-amber-500' : 'bg-zinc-800 text-zinc-500'
                                    }`}>
                                        {idx + 1}º
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{org.name || 'Sem Nome'}</p>
                                        <p className="text-xs text-zinc-500">
                                            {org.slug} • {org.subscription_status}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-bold text-white">{org.memberCount}</span>
                                    <span className="text-[10px] text-zinc-500 uppercase">Perfis</span>
                                </div>
                            </div>
                        ))}
                        {topOrgs.length === 0 && !loading && (
                            <p className="text-zinc-500 text-sm">Nenhuma barbearia ativa.</p>
                        )}
                    </div>
                </Card>

                <Card className="h-full bg-zinc-900 border-zinc-800">
                    <div className="mb-4 p-4 pb-0">
                        <h3 className="text-lg font-bold text-white">Alertas do Sistema</h3>
                        <p className="text-sm text-zinc-500">Avisos importantes sobre a infraestrutura</p>
                    </div>
                    
                    <div className="p-4 pt-2 space-y-3">
                        {loading ? (
                            <p className="text-zinc-500 text-sm">Carregando...</p>
                        ) : systemAlerts.length > 0 ? (
                            systemAlerts.map(alert => {
                                const Icon = alert.icon;
                                const styleClasses = 
                                    alert.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                    alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-500';
                                
                                return (
                                    <div key={alert.id} className={`flex flex-col gap-2 p-3 rounded-lg border ${styleClasses}`}>
                                        <div className="flex items-start gap-3">
                                            <Icon size={18} className="mt-0.5 shrink-0" />
                                            <p className="text-sm font-medium leading-relaxed">{alert.message}</p>
                                        </div>
                                        {alert.details && alert.details.length > 0 && (
                                            <div className="ml-7 mt-1 space-y-1">
                                                <p className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-2">Organizações Afetadas:</p>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {alert.details.map((orgName, idx) => (
                                                        <li key={idx} className="text-xs opacity-90">{orgName}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-zinc-500 text-sm">
                                <CheckCircle size={32} className="mb-2 opacity-20 text-green-500" />
                                Nenhum alerta crítico. Tudo operando normalmente.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, trend, isNegative, icon: Icon, color }: any) => (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
        <div className="flex items-start justify-between mb-4">
            <div>
                <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg bg-black/40 ${color}`}>
                <Icon size={20} />
            </div>
        </div>
        <p className={`text-xs font-medium ${isNegative ? 'text-red-500' : 'text-zinc-500'}`}>
            {trend}
        </p>
    </div>
);
