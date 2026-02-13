import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Users, Building2, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Organization } from '../../types';
import { format } from 'date-fns';

export const PlatformDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalOrgs: 0,
        activeUsers: 0,
        mrr: 0,
        churnRate: 0
    });
    const [recentOrgs, setRecentOrgs] = useState<Organization[]>([]);
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

            // 2. Total Users (Profiles)
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // 3. Recent Organizations (limit 3)
            const { data: recent } = await supabase
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            // Calculate MRR (Simple assumption: R$ 97,00 per active org)
            // In real world, check planType and payment status
            const activeOrgs = orgsData?.filter(o => o.subscriptionStatus === 'active' || o.subscriptionStatus === 'trial') || [];
            const estimatedMrr = activeOrgs.length * 97.00;

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-full bg-zinc-900 border-zinc-800">
                    <h3 className="text-lg font-bold text-white mb-4 p-4 pb-0">Barbearias Recentes</h3>
                    <div className="p-4 space-y-4">
                        {loading ? (
                            <p className="text-zinc-500">Carregando...</p>
                        ) : recentOrgs.map((org) => (
                            <div key={org.id} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-xs text-zinc-400">
                                        {org.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{org.name}</p>
                                        <p className="text-xs text-zinc-500">
                                            {org.createdAt ? format(new Date(org.createdAt), 'dd/MM/yyyy') : 'Recente'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full border ${org.subscriptionStatus === 'active'
                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                    }`}>
                                    {org.subscriptionStatus}
                                </span>
                            </div>
                        ))}
                        {recentOrgs.length === 0 && !loading && (
                            <p className="text-zinc-500 text-sm">Nenhuma barbearia encontrada.</p>
                        )}
                    </div>
                </Card>

                <Card className="h-full bg-zinc-900 border-zinc-800">
                    <h3 className="text-lg font-bold text-white mb-4 p-4 pb-0">Alertas do Sistema</h3>
                    <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-sm">
                        <AlertCircle size={32} className="mb-2 opacity-20" />
                        Nenhum alerta crítico no momento.
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
