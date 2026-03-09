import React from 'react';
import { Card } from '../ui/Card';
import { ShieldAlert, Activity, ClipboardList } from 'lucide-react';

export const PlatformMonitoring: React.FC = () => {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Monitoramento do Sistema</h1>
                <p className="text-zinc-400">Saúde das integrações, performance e logs de auditoria.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="text-emerald-400" size={24} />
                        <h3 className="font-bold text-white">Saúde das APIs</h3>
                    </div>
                    <div className="space-y-3 mt-4">
                        <div className="flex justify-between items-center p-2 bg-black/20 rounded border border-zinc-800/50">
                            <span className="text-xs text-zinc-400">Mercado Pago</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-black/20 rounded border border-zinc-800/50">
                            <span className="text-xs text-zinc-400">Evolution API (WA)</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldAlert className="text-amber-400" size={24} />
                        <h3 className="font-bold text-white">Performance Técnica</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">Tempo de resposta médio e carga do banco de dados.</p>
                    <div className="h-24 bg-black/40 rounded flex items-center justify-center border border-zinc-800 border-dashed">
                        <span className="text-zinc-600 text-sm italic">Métricas em tempo real...</span>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                        <ClipboardList className="text-blue-400" size={24} />
                        <h3 className="font-bold text-white">Logs de Auditoria</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">Histórico global de ações críticas na plataforma.</p>
                    <button className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-all text-sm font-medium">
                        Ver Todos os Logs
                    </button>
                </Card>
            </div>
        </div>
    );
};
