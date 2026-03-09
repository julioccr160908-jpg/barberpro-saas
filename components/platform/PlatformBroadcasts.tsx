import React from 'react';
import { Card } from '../ui/Card';
import { Megaphone, Plus, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';

export const PlatformBroadcasts: React.FC = () => {
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Avisos do Sistema</h1>
                    <p className="text-zinc-400">Envie mensagens globais para donos de barbearias e profissionais.</p>
                </div>
                <Button className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                    <Plus size={16} />
                    Novo Aviso
                </Button>
            </header>

            <Card className="bg-zinc-900 border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
                    <Megaphone size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Nenhum aviso ativo</h3>
                <p className="text-zinc-500 max-w-sm">
                    Você ainda não criou nenhum comunicado global. Crie um para avisar sobre manutenções ou novas funcionalidades.
                </p>
            </Card>
        </div>
    );
};
