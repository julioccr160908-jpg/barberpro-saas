import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { ShieldAlert, Activity, ClipboardList, RefreshCw, BarChart3 } from 'lucide-react';
import { PlatformService, SystemHealth } from '../../services/PlatformService';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const PlatformMonitoring: React.FC = () => {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [perfData] = useState([
        { time: '12:00', latency: 45 },
        { time: '13:00', latency: 52 },
        { time: '14:00', latency: 48 },
        { time: '15:00', latency: 120 },
        { time: '16:00', latency: 65 },
        { time: '17:00', latency: 42 },
    ]);

    const checkHealth = async () => {
        setLoading(true);
        const result = await PlatformService.checkSystemHealth();
        setHealth(result);
        setLoading(false);
    };

    useEffect(() => {
        checkHealth();
    }, []);

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Monitoramento do Sistema</h1>
                    <p className="text-zinc-400">Saúde das integrações, performance e logs de auditoria.</p>
                </div>
                <button 
                    onClick={checkHealth}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all font-medium"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Atualizar Status
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="text-emerald-400" size={24} />
                        <h3 className="font-bold text-white">Saúde das APIs</h3>
                    </div>
                    <div className="space-y-4">
                        <HealthItem label="Supabase DB" status={loading ? 'loading' : health?.supabase} />
                        <HealthItem label="Mercado Pago" status={loading ? 'loading' : health?.mercadopago} />
                        <HealthItem label="Evolution API (WA)" status={loading ? 'loading' : health?.whatsapp} />
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="text-amber-400" size={24} />
                        <h3 className="font-bold text-white">Performance Técnica (Latência API)</h3>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%" minHeight={288}>
                            <LineChart data={perfData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}ms`} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', fontSize: '12px' }} />
                                <Line type="monotone" dataKey="latency" stroke="#fbbf24" strokeWidth={2} dot={{ r: 4, fill: '#fbbf24' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800 lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <ClipboardList className="text-blue-400" size={24} />
                            <h3 className="font-bold text-white">Últimas Atividades de Auditoria</h3>
                        </div>
                        <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">Ver Histórico Completo</button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-zinc-400">
                            <thead className="text-xs uppercase bg-black/40 text-zinc-500 border-b border-zinc-800">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Data/Hora</th>
                                    <th className="px-4 py-3 font-bold">Ação</th>
                                    <th className="px-4 py-3 font-bold">Tipo</th>
                                    <th className="px-4 py-3 font-bold">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                <tr className="hover:bg-zinc-800/30">
                                    <td className="px-4 py-3 whitespace-nowrap">{format(new Date(), 'dd/MM HH:mm:ss')}</td>
                                    <td className="px-4 py-3"><span className="text-blue-400 font-bold">APPROVED_ORG</span></td>
                                    <td className="px-4 py-3">organization</td>
                                    <td className="px-4 py-3 text-zinc-500">Aprovação de nova conta...</td>
                                </tr>
                                <tr className="hover:bg-zinc-800/30">
                                    <td className="px-4 py-3 whitespace-nowrap">{format(new Date(), 'dd/MM HH:mm:ss')}</td>
                                    <td className="px-4 py-3"><span className="text-amber-400 font-bold">CHANGED_PLAN</span></td>
                                    <td className="px-4 py-3">organization</td>
                                    <td className="px-4 py-3 text-zinc-500">Alterado plano para PRO...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const HealthItem = ({ label, status }: { label: string, status?: string }) => {
    const isOnline = status === 'online';
    const isUnconfigured = status === 'unconfigured';
    const isLoading = status === 'loading';

    return (
        <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg border border-zinc-800/50">
            <span className="text-sm font-medium text-zinc-300">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isOnline ? 'text-emerald-500' : 
                    isUnconfigured ? 'text-zinc-500' :
                    isLoading ? 'text-blue-400' : 'text-red-500'
                }`}>
                    {isLoading ? 'Checando...' : isUnconfigured ? 'NR' : isOnline ? 'Online' : 'Offline'}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${
                    isLoading ? 'bg-blue-500 animate-pulse' :
                    isUnconfigured ? 'bg-zinc-600' :
                    isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                }`}></div>
            </div>
        </div>
    );
};
