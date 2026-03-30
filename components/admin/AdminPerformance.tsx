import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Card } from '../ui/Card';
import { 
    TrendingUp, 
    Users, 
    Star, 
    Award, 
    BarChart3, 
    PieChart, 
    UserPlus,
    Loader2
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell 
} from 'recharts';

export const AdminPerformance: React.FC = () => {
    const { organization } = useOrganization();

    // Fetch Barber Performance Data
    const { data: stats = [], isLoading } = useQuery({
        queryKey: ['admin-barber-stats', organization?.id],
        queryFn: async () => {
            if (!organization?.id) return [];

            // 1. Get all barbers for this org
            const { data: barbers } = await supabase
                .from('profiles')
                .select('id, name')
                .eq('organization_id', organization.id)
                .in('role', ['BARBER', 'ADMIN']);

            if (!barbers) return [];

            // 2. Fetch stats for each barber (simplified approach for demonstration)
            // In a real app, this would be a single optimized query or a Postgres Function (RPC)
            const performanceData = await Promise.all(barbers.map(async (barber) => {
                // Total Completed Appointments
                const { count: apptCount } = await supabase
                    .from('appointments')
                    .select('*', { count: 'exact', head: true })
                    .eq('barber_id', barber.id)
                    .eq('status', 'COMPLETED');

                // Average Rating
                const { data: reviews } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('barber_id', barber.id);
                
                const avgRating = reviews && reviews.length > 0 
                    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
                    : 0;

                // Revenue (Sum of services)
                const { data: appts } = await supabase
                    .from('appointments')
                    .select('service_id, service:services(price)')
                    .eq('barber_id', barber.id)
                    .eq('status', 'COMPLETED');
                
                const revenue = appts?.reduce((sum, a) => sum + (a.service as any)?.price || 0, 0) || 0;

                return {
                    name: barber.name.split(' ')[0],
                    appointments: apptCount || 0,
                    rating: parseFloat(avgRating.toFixed(1)),
                    revenue: revenue
                };
            }));

            return performanceData.sort((a, b) => b.revenue - a.revenue);
        },
        enabled: !!organization?.id
    });

    const COLORS = ['#EAB308', '#60A5FA', '#A855F7', '#10B981', '#F43F5E'];

    if (!organization) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Performance da Equipe</h1>
                <p className="text-zinc-400">Análise de produtividade e satisfação por profissional.</p>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 text-zinc-500">
                    <Loader2 size={40} className="animate-spin mb-4" />
                    <p>Processando métricas de performance...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Rankings Table */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Award size={20} className="text-yellow-500" />
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Ranking</h2>
                        </div>
                        
                        <Card className="bg-zinc-900 border-zinc-800 p-0 overflow-hidden">
                            <div className="divide-y divide-white/5">
                                {stats.map((barber, index) => (
                                    <div key={barber.name} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <span className={`text-lg font-display font-bold ${index === 0 ? 'text-yellow-500' : 'text-zinc-600'}`}>0{index + 1}</span>
                                            <div>
                                                <p className="text-sm font-bold text-white">{barber.name}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                                    <span className="text-xs font-semibold text-zinc-500">{barber.rating}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white">R$ {barber.revenue.toLocaleString('pt-BR')}</p>
                                            <p className="text-xs text-zinc-600 uppercase font-semibold">{barber.appointments} atendimentos</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="bg-primary/10 border-primary/20 p-6">
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                <TrendingUp size={18} className="text-primary" />
                                Meta de Conversão
                            </h4>
                            <p className="text-sm text-zinc-400">
                                Barbeiros com nota acima de 4.8 e mais de 50 atendimentos mensais ganham destaque no agendamento premium.
                            </p>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Revenue Comparison */}
                        <Card className="bg-zinc-900 border-zinc-800 p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={20} className="text-primary" />
                                    <h3 className="text-lg font-bold text-white">Faturamento por Barbeiro</h3>
                                </div>
                                <span className="text-xs text-zinc-500 uppercase font-semibold tracking-wide">Este Mês</span>
                            </div>
                            
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} />
                                        <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                                            {stats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <Card className="bg-zinc-900 border-zinc-800 p-6 flex items-start gap-4">
                                <div className="p-3 bg-zinc-800 rounded-xl text-yellow-500">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Taxa de Retenção</h4>
                                    <p className="text-xs text-zinc-500">Média da equipe: 64%</p>
                                </div>
                            </Card>
                            <Card className="bg-zinc-900 border-zinc-800 p-6 flex items-start gap-4">
                                <div className="p-3 bg-zinc-800 rounded-xl text-blue-500">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Novos Clientes</h4>
                                    <p className="text-xs text-zinc-500">Indicações diretas: +12</p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
