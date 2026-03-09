import React, { useState } from 'react';
import { Save, CreditCard, Clock, Globe, ShieldCheck, DollarSign, Calendar, LayoutTemplate } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

export const PlatformSettings: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        trialDays: 14,
        monthlyPrice: 97.00,
        currency: 'BRL',
        appName: 'BarberHost'
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
        <div className="space-y-8 relative">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-2">
                    <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                        Configurações da Plataforma
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl">
                        Controle os parâmetros globais, identidade visual e integrações que ditam o funcionamento do BarberHost.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => window.location.reload()} disabled={loading} className="rounded-xl border-zinc-800 hover:bg-zinc-800/80 h-12 px-6">
                        Descartar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 h-12 px-6">
                        <Save size={18} className="mr-2" />
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
                {/* Subscription Standards Card */}
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="flex items-start gap-5 mb-8 relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 flex items-center justify-center border border-blue-500/20 shrink-0 shadow-inner">
                            <Clock size={28} className="text-blue-400" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-white text-2xl tracking-tight mb-1">Padrões de Assinatura</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Regras comerciais padronizadas para o onboarding de novas barbearias.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 relative">
                        <div className="group/input">
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-3">
                                <Calendar size={16} className="text-zinc-500 group-focus-within/input:text-blue-400 transition-colors" />
                                Dias de Teste Grátis (Trial)
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    name="trialDays"
                                    type="number"
                                    value={settings.trialDays}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-5 text-white text-lg font-medium focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-white/5">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Dias</span>
                                </div>
                            </div>
                        </div>

                        <div className="group/input">
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-3">
                                <DollarSign size={16} className="text-zinc-500 group-focus-within/input:text-blue-400 transition-colors" />
                                Valor Mensal (Plano Básico)
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                    <span className="text-zinc-500 font-bold text-lg">R$</span>
                                </div>
                                <input
                                    name="monthlyPrice"
                                    type="number"
                                    step="0.01"
                                    value={settings.monthlyPrice}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-5 text-white text-lg font-medium focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual Identity Card */}
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="flex items-start gap-5 mb-8 relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 flex items-center justify-center border border-purple-500/20 shrink-0 shadow-inner">
                            <LayoutTemplate size={28} className="text-purple-400" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-white text-2xl tracking-tight mb-1">Identidade Visual</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Personalização de marca e apresentação do sistema global.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 relative">
                        <div className="group/input">
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-3">
                                Nome da Aplicação (Title Bar)
                            </label>
                            <input
                                name="appName"
                                type="text"
                                value={settings.appName}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-5 text-white text-lg font-medium focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                            />
                        </div>
                        
                        <div className="group/input opacity-70">
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-3">
                                Moeda Principal do Sistema
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Globe size={18} className="text-zinc-600" />
                                </div>
                                <input
                                    name="currency"
                                    type="text"
                                    value={settings.currency}
                                    disabled
                                    className="w-full bg-black/20 border border-white/5 rounded-xl py-3.5 pl-12 pr-5 text-zinc-500 text-lg cursor-not-allowed shadow-inner"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 border border-white/5 bg-black/30 px-3 py-1.5 rounded-lg">
                                    <span className="text-xs font-bold text-zinc-600 uppercase">Imutável</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gateway Card - Spans full width */}
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl xl:col-span-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center border border-emerald-500/20 shrink-0 shadow-inner relative">
                                <CreditCard size={28} className="text-emerald-400" strokeWidth={1.5} />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 animate-pulse"></div>
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-white text-2xl tracking-tight mb-1">Mercado Pago</h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    Credenciais para faturamento contínuo das assinaturas.
                                </p>
                            </div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2 backdrop-blur-md">
                            <ShieldCheck size={18} className="text-emerald-400" />
                            <span className="text-emerald-400 font-semibold text-sm">Integração Ativa</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-zinc-400">Chave de Produção (Access Token)</label>
                            <div className="bg-black/40 border border-white/10 rounded-xl p-4 shadow-inner group/token relative cursor-crosshair overflow-hidden hover:border-emerald-500/30 transition-colors">
                                <div className="font-mono text-zinc-400 tracking-wider blur-[5px] group-hover/token:blur-none transition-all duration-300 select-all">
                                    APP_USR-123***-XYZ-*******
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover/token:opacity-0 transition-opacity bg-black/20">
                                    <span className="text-xs font-bold text-emerald-500/70 tracking-widest uppercase bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 backdrop-blur-md">Passe o mouse para revelar</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-zinc-400">Chave Pública (Public Key)</label>
                            <div className="bg-black/40 border border-white/10 rounded-xl p-4 shadow-inner">
                                <div className="font-mono text-zinc-300 tracking-wider select-all">
                                    APP_USR-5a0225d3-8555-46f9...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
