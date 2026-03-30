import React from 'react';
import { Card } from '../ui/Card';
import { Zap, TrendingUp, Users, Download, ArrowRight, Mail, Phone, Calendar } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';

export const PlatformGrowth: React.FC = () => {
    const [pendingOrgs, setPendingOrgs] = React.useState<any[]>([]);
    const [stats, setStats] = React.useState({ active: 0, pending: 0, churn: 0 });
    const [loading, setLoading] = React.useState(true);

    const loadGrowthData = async () => {
        setLoading(true);
        const { data: orgs } = await supabase.from('organizations').select('id, name, subscription_status, created_at, owner_id');
        if (orgs) {
            setPendingOrgs(orgs.filter(o => o.subscription_status === 'pending'));
            setStats({
                active: orgs.filter(o => o.subscription_status === 'active').length,
                pending: orgs.filter(o => o.subscription_status === 'pending').length,
                churn: orgs.filter(o => o.subscription_status === 'canceled').length,
            });
        }
        setLoading(false);
    };

    const handleExportBI = async () => {
        const { data: orgs } = await supabase.from('organizations').select('*');
        if (!orgs) return;

        const headers = ['ID', 'Nome', 'Status', 'Criado Em', 'Dono ID'];
        const csvContent = [
            headers.join(','),
            ...orgs.map(o => [o.id, `"${o.name}"`, o.subscription_status, o.created_at, o.owner_id].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `report-bi-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Relatório BI exportado com sucesso!');
    };

    React.useEffect(() => {
        loadGrowthData();
    }, []);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Crescimento & BI</h1>
                <p className="text-zinc-400">Gerencie onboarding, engajamento e exportação de dados.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-zinc-900 border-zinc-800 h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Users className="text-blue-400" size={24} />
                            <h3 className="font-bold text-white">Funil de Onboarding</h3>
                        </div>
                        <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded">{stats.pending} pendentes</span>
                    </div>
                    <div className="space-y-3">
                        {pendingOrgs.slice(0, 3).map(org => (
                            <div key={org.id} className="p-3 bg-black/40 border border-zinc-800 rounded-lg flex items-center justify-between group cursor-pointer hover:border-blue-500/50 transition-all">
                                <div>
                                    <div className="text-sm font-bold text-white">{org.name}</div>
                                    <div className="text-xs text-zinc-500 flex items-center gap-1">
                                        <Calendar size={10} />
                                        Inscrito em {new Date(org.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <ArrowRight size={14} className="text-zinc-600 group-hover:text-blue-400 translate-x-0 group-hover:translate-x-1 transition-all" />
                            </div>
                        ))}
                        {pendingOrgs.length > 3 && <div className="text-center text-xs text-zinc-500 mt-2">+{pendingOrgs.length - 3} outros</div>}
                        {pendingOrgs.length === 0 && <div className="text-center text-xs text-zinc-600 italic py-4">Nenhuma conta pendente</div>}
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="text-green-400" size={24} />
                        <h3 className="font-bold text-white">Taxa de Conversão</h3>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-white">
                            {stats.active > 0 ? ((stats.active / (stats.active + stats.pending + stats.churn)) * 100).toFixed(1) : 0}%
                        </span>
                        <span className="text-xs text-zinc-500 mb-1.5 uppercase font-semibold tracking-wide">Conversão Total</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${stats.active > 0 ? (stats.active / (stats.active + stats.pending + stats.churn)) * 100 : 0}%` }}></div>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                        <Download className="text-purple-400" size={24} />
                        <h3 className="font-bold text-white">Exportação BI</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">Extraia dados consolidados para Excel ou ferramentas de BI.</p>
                    <button 
                        onClick={handleExportBI}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold font-display uppercase tracking-wide"
                    >
                        Exportar Relatório CSV
                    </button>
                </Card>
            </div>
        </div>
    );
};
