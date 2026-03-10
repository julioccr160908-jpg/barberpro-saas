import React from 'react';
import { Card } from './ui/Card';
import { TrendingUp, Users, DollarSign, Package, Star, Award, ChevronRight } from 'lucide-react';
import { useBarberStats } from '../hooks/useBarberStats';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from './ui/Skeleton';

export const BarberInsights: React.FC = () => {
    const { user } = useAuth();
    const {
        serviceRevenue,
        productRevenue,
        totalRevenue,
        appointmentCount,
        averageTicket,
        retentionRate,
        topServices,
        isLoading
    } = useBarberStats(user?.id);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
        <Card className="relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform ${color}`}>
                <Icon size={64} />
            </div>
            <div className="relative z-10">
                <p className="text-xs font-bold text-textMuted uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl font-display font-bold text-white mb-2">{value}</h3>
                {subValue && <p className="text-[10px] text-textMuted font-medium uppercase tracking-tighter">{subValue}</p>}
            </div>
        </Card>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-2xl font-display font-bold text-white uppercase tracking-widest">Meus Insights</h2>
                  <p className="text-sm text-textMuted">Acompanhe seu desempenho e crescimento profissional.</p>
               </div>
               <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-2">
                   <Award size={16} className="text-primary" />
                   <span className="text-xs font-bold text-primary uppercase">Mestre Barbeiro</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Faturamento Total" 
                    value={`R$ ${totalRevenue.toFixed(2)}`} 
                    icon={DollarSign} 
                    color="text-green-500"
                    subValue={`${appointmentCount} serviços realizados`}
                />
                <StatCard 
                    title="Ticket Médio" 
                    value={`R$ ${averageTicket.toFixed(2)}`} 
                    icon={TrendingUp} 
                    color="text-blue-500"
                    subValue="Por atendimento"
                />
                <StatCard 
                    title="Taxa de Retenção" 
                    value={`${retentionRate.toFixed(1)}%`} 
                    icon={Users} 
                    color="text-purple-500"
                    subValue="Clientes que voltaram"
                />
                <StatCard 
                    title="Venda de Produtos" 
                    value={`R$ ${productRevenue.toFixed(2)}`} 
                    icon={Package} 
                    color="text-yellow-500"
                    subValue="Comissão extra"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Services */}
                <Card className="lg:col-span-1">
                    <h3 className="text-sm font-bold text-white uppercase mb-6 flex items-center gap-2">
                        <Star size={16} className="text-primary" /> Serviços Mais Procurados
                    </h3>
                    <div className="space-y-4">
                        {topServices.map((service, index) => (
                            <div key={index} className="flex items-center justify-between group cursor-default">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-zinc-600">0{index + 1}</span>
                                    <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">{service.name}</p>
                                </div>
                                <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-500">{service.count}x</span>
                            </div>
                        ))}
                        {topServices.length === 0 && <p className="text-center py-8 text-zinc-600 italic text-sm">Nenhum serviço realizado.</p>}
                    </div>
                </Card>

                {/* Goals / Progress Placeholder */}
                <Card className="lg:col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
                    <div className="relative z-10 h-full flex flex-col">
                        <h3 className="text-sm font-bold text-white uppercase mb-2">Meta Mensal</h3>
                        <div className="mt-4 mb-2 flex justify-between items-end">
                            <span className="text-3xl font-display font-bold text-white">R$ {totalRevenue.toFixed(0)} <span className="text-zinc-600 text-lg">/ 5.000</span></span>
                            <span className="text-primary font-bold">{((totalRevenue / 5000) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
                                style={{ width: `${Math.min(100, (totalRevenue / 5000) * 100)}%` }}
                            />
                        </div>
                        <p className="mt-4 text-xs text-textMuted max-w-md">
                            Continue assim! Você está a R$ {(5000 - totalRevenue).toFixed(2)} de atingir sua meta e desbloquear o bônus de produtividade.
                        </p>
                        
                        <div className="mt-auto pt-8 flex gap-4">
                            <button className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left">
                                <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Dica Pro</p>
                                <p className="text-xs text-zinc-400">Ofereça um Balm para barba após o corte para aumentar seu ticket médio.</p>
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
