import React from 'react';
import { Card } from '../ui/Card';
import { Zap, TrendingUp, Users, Download } from 'lucide-react';

export const PlatformGrowth: React.FC = () => {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Crescimento & BI</h1>
                <p className="text-zinc-400">Gerencie onboarding, engajamento e exportação de dados.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="text-blue-400" size={24} />
                        <h3 className="font-bold text-white">CRM de Onboarding</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">Acompanhe novas barbearias no funil de configuração inicial.</p>
                    <div className="h-40 bg-black/40 rounded flex items-center justify-center border border-zinc-800 border-dashed">
                        <span className="text-zinc-600 text-sm italic">Em desenvolvimento...</span>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="text-green-400" size={24} />
                        <h3 className="font-bold text-white">Health Score</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">Índice de engajamento baseado no uso de agendamentos.</p>
                    <div className="h-40 bg-black/40 rounded flex items-center justify-center border border-zinc-800 border-dashed">
                        <span className="text-zinc-600 text-sm italic">Em desenvolvimento...</span>
                    </div>
                </Card>

                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                        <Download className="text-purple-400" size={24} />
                        <h3 className="font-bold text-white">Exportação BI</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">Extraia dados consolidados para Excel ou ferramentas de BI.</p>
                    <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium">
                        Exportar Relatório Geral
                    </button>
                </Card>
            </div>
        </div>
    );
};
