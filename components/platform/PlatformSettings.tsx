import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Settings, Save, CreditCard, Clock, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

export const PlatformSettings: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        trialDays: 14,
        monthlyPrice: 97.00,
        currency: 'BRL',
        appName: 'BarberHost SaaS'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            toast.success('Configurações salvas com sucesso!');
        }, 1000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-display font-bold text-white">Configurações da Plataforma</h1>
                <p className="text-zinc-400">Definições globais do sistema.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Clock size={20} />
                        </div>
                        <h3 className="font-bold text-white text-lg">Padrões de Assinatura</h3>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Dias de Teste Grátis (Trial)"
                            name="trialDays"
                            type="number"
                            value={settings.trialDays}
                            onChange={handleChange}
                            placeholder="ex: 14"
                        />
                        <Input
                            label="Preço Mensal Padrão (R$)"
                            name="monthlyPrice"
                            type="number"
                            value={settings.monthlyPrice}
                            onChange={handleChange}
                            placeholder="ex: 97.00"
                        />
                    </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <Globe size={20} />
                        </div>
                        <h3 className="font-bold text-white text-lg">Informações Gerais</h3>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Nome da Aplicação"
                            name="appName"
                            value={settings.appName}
                            onChange={handleChange}
                        />
                        <Input
                            label="Moeda Padrão"
                            name="currency"
                            value={settings.currency}
                            onChange={handleChange}
                            disabled
                        />
                    </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="font-bold text-white text-lg">Gateway de Pagamento (Mock)</h3>
                    </div>

                    <div className="p-4 bg-black/40 rounded-lg border border-zinc-800">
                        <p className="text-sm text-zinc-400 mb-2">Chave de API Pública</p>
                        <div className="font-mono text-xs bg-black p-2 rounded text-zinc-500">
                            pk_test_51Mz...XyZ
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading}>
                    <Save size={18} className="mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </div>
    );
};
