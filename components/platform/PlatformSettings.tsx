import React from 'react';
import { Card } from '../ui/Card';
import { Settings } from 'lucide-react';

export const PlatformSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-display font-bold text-white">Configurações da Plataforma</h1>
                <p className="text-zinc-400">Ajustes globais do sistema SaaS.</p>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 text-center py-20">
                <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                        <Settings size={32} className="text-zinc-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Em Construção</h2>
                    <p className="text-zinc-500 max-w-md">
                        Aqui você poderá configurar planos, preços, gateways de pagamento e chaves de API globais.
                    </p>
                </div>
            </Card>
        </div>
    );
};
