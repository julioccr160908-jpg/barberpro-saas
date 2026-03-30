import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Gift, Save, ToggleLeft, ToggleRight, Loader2, Users, Trophy, Zap, Scissors, Info, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { db } from '../../services/database';
import { supabase } from '../../services/supabase';
import { useSettings } from '../../contexts/SettingsContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FeatureGate } from '../ui/FeatureGate';

export const AdminLoyaltySettings: React.FC = () => {
    const { organization } = useOrganization();
    const { settings, updateSettings, isLoading: isContextLoading } = useSettings();
    const [enabled, setEnabled] = useState(false);
    const [target, setTarget] = useState(10);
    const [rewardDescription, setRewardDescription] = useState('1 Corte Grátis');
    const [expirationDays, setExpirationDays] = useState(90);
    const [useExpiration, setUseExpiration] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (settings) {
            setEnabled(settings.loyalty_enabled || settings.loyaltyEnabled || false);
            setTarget(settings.loyalty_target || settings.loyaltyTarget || 10);
            setRewardDescription(settings.loyalty_reward_description || settings.loyaltyRewardDescription || '1 Corte Grátis');
            setExpirationDays(settings.loyalty_expiration_days || settings.loyaltyExpirationDays || 90);
            setUseExpiration(!!(settings.loyalty_expiration_days || settings.loyaltyExpirationDays));
        }
    }, [settings]);

    // Fetch Loyalty Stats
    const { data: loyaltyStats, isLoading: loadingStats } = useQuery({
        queryKey: ['loyalty-stats', organization?.id],
        queryFn: async () => {
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('loyalty_count, loyalty_history')
                .eq('organization_id', organization?.id);
            if (pError) throw pError;

            const activeParticipants = profiles.filter(p => (p.loyalty_count || 0) > 0).length;
            
            let rewardsDelivered = 0;
            profiles.forEach(p => {
                const history = p.loyalty_history as any[] || [];
                rewardsDelivered += Array.isArray(history) ? history.filter(h => h.type === 'redemption').length : 0;
            });

            // Average Frequency calculation
            const { data: appointments, error: aError } = await supabase
                .from('appointments')
                .select('customer_id, date')
                .eq('organization_id', organization?.id)
                .order('date', { ascending: true });
            if (aError) throw aError;

            const customerGaps: number[] = [];
            const appointmentsByCustomer: Record<string, string[]> = {};
            appointments.forEach(a => {
                if (!a.customer_id) return;
                if (!appointmentsByCustomer[a.customer_id]) appointmentsByCustomer[a.customer_id] = [];
                appointmentsByCustomer[a.customer_id].push(a.date);
            });

            Object.values(appointmentsByCustomer).forEach(dates => {
                if (dates.length < 2) return;
                for (let i = 1; i < dates.length; i++) {
                    const diff = new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime();
                    customerGaps.push(diff / (1000 * 60 * 60 * 24));
                }
            });

            const avgFrequency = customerGaps.length > 0
                ? Math.round(customerGaps.reduce((a, b) => a + b, 0) / customerGaps.length)
                : 0;

            return { activeParticipants, rewardsDelivered, avgFrequency };
        },
        enabled: !!organization?.id
    });

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateSettings({
                ...settings,
                loyalty_enabled: enabled,
                loyalty_target: target,
                loyalty_reward_description: rewardDescription,
                loyalty_expiration_days: useExpiration ? expirationDays : null
            });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            toast.success('Fidelidade atualizada com sucesso!');
        } catch (error: any) {
            console.error('Erro:', error);
            toast.error(`Erro: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isContextLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <FeatureGate
            requiredPlan="pro"
            title="Programa de Fidelidade"
            description="Fidelize seus clientes oferecendo recompensas. Recurso disponível a partir do plano Pro."
        >
            <div className="space-y-8 animate-fade-in">
                {/* Header Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-surface/50 border-white/5 relative overflow-hidden group">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Participantes Ativos</span>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-display font-bold text-white">{loadingStats ? '...' : loyaltyStats?.activeParticipants}</h3>
                                <Users size={16} className="text-primary opacity-50" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-surface/50 border-white/5 relative overflow-hidden group">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Recompensas Entregues</span>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-display font-bold text-white">{loadingStats ? '...' : loyaltyStats?.rewardsDelivered}</h3>
                                <Trophy size={16} className="text-yellow-500 opacity-50" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-surface/50 border-white/5 relative overflow-hidden group">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Frequência Média</span>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-display font-bold text-white">{loadingStats ? '...' : loyaltyStats?.avgFrequency}d</h3>
                                <Zap size={16} className="text-blue-500 opacity-50" />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Left Column: Configuration */}
                    <Card className="p-8 border-white/5 bg-zinc-900/50 backdrop-blur-sm self-start">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                                <Gift size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Centro de Estratégia</h2>
                                <p className="text-xs text-zinc-400">Desenhe a jornada de fidelização do seu cliente.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Status Banner Glassmorphism */}
                            <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                                enabled 
                                ? 'bg-green-500/[0.03] border-green-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.05)]' 
                                : 'bg-red-500/[0.03] border-red-500/10 opacity-60'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]' : 'bg-zinc-600'}`} />
                                        <p className="text-sm font-bold text-white uppercase tracking-widest">{enabled ? 'Programa Ativo' : 'Programa Desativado'}</p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className={`text-xs font-bold uppercase tracking-wide hover:bg-transparent ${enabled ? 'text-red-400 hover:text-red-300' : 'text-primary hover:text-primary/80'}`}
                                        onClick={() => setEnabled(!enabled)}
                                    >
                                        {enabled ? 'Desativar' : 'Ativar Agora'}
                                    </Button>
                                </div>
                            </div>

                            {enabled && (
                                <div className="space-y-5 animate-in slide-in-from-left-4 duration-500">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Meta de Pontos</label>
                                            <Input
                                                type="number"
                                                value={target}
                                                onChange={(e) => setTarget(Number(e.target.value))}
                                                className="bg-black/20 border-white/5 text-white"
                                                min={1}
                                                max={50}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Prêmio (Curto)</label>
                                            <Input
                                                placeholder="Ex: 1 Corte Grátis"
                                                value={rewardDescription}
                                                onChange={(e) => setRewardDescription(e.target.value)}
                                                className="bg-black/20 border-white/5 text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-zinc-500" />
                                                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Validade dos Pontos</span>
                                            </div>
                                            <button 
                                                onClick={() => setUseExpiration(!useExpiration)}
                                                className={`transition-colors duration-300 ${useExpiration ? 'text-primary' : 'text-zinc-600'}`}
                                            >
                                                {useExpiration ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                            </button>
                                        </div>
                                        {useExpiration && (
                                            <div className="flex items-center gap-3 animate-in fade-in duration-300">
                                                <Input 
                                                    type="number"
                                                    value={expirationDays}
                                                    onChange={e => setExpirationDays(Number(e.target.value))}
                                                    className="w-24 bg-black/40 border-white/10"
                                                />
                                                <span className="text-xs text-zinc-500">dias corridos</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <Button 
                                onClick={handleSave} 
                                disabled={isLoading} 
                                className={`w-full h-12 transition-all duration-500 ${showSuccess ? 'bg-green-500 hover:bg-green-500' : 'bg-primary text-black'}`}
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin mr-2" />
                                ) : showSuccess ? (
                                    <CheckCircle2 size={20} className="mr-2 animate-in zoom-in duration-300" />
                                ) : (
                                    <Save size={18} className="mr-2" />
                                )}
                                {showSuccess ? 'Alterações Salvas!' : 'Salvar Estratégia'}
                            </Button>
                        </div>
                    </Card>

                    {/* Right Column: Visualizer (Mockup) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 px-2">
                            <Info size={14} className="text-primary" />
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Visualização (App do Cliente)</h3>
                        </div>
                        
                        <div className="p-12 bg-zinc-950 border border-white/5 rounded-[40px] flex items-center justify-center relative overflow-hidden min-h-[400px]">
                            {/* Abstract background light */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 blur-[120px] rounded-full" />
                            
                            <div className="relative w-full max-w-[300px] aspect-[1.6/1] bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden p-5 flex flex-col justify-between">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                                    <Scissors size={80} />
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Loyalty Card</p>
                                        <h4 className="text-white font-bold tracking-tight text-sm line-clamp-1">{rewardDescription || 'Recompensa'}</h4>
                                    </div>
                                    <Gift size={20} className="text-primary opacity-50" />
                                </div>
                                
                                <div className="flex flex-wrap gap-2.5 justify-center py-4">
                                    {Array.from({ length: target }).map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-700 ${
                                                i < 3 // Simulating 3 points for visualizer
                                                ? 'bg-primary border-primary shadow-[0_0_15px_rgba(234,179,8,0.3)] text-black' 
                                                : 'bg-white/5 border-white/10 text-zinc-800'
                                            }`}
                                        >
                                            <Scissors size={16} />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Client Name</p>
                                        <p className="text-[8px] text-zinc-700 font-mono">0000-1111-2222</p>
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 rounded-full text-xs text-zinc-400 font-bold border border-white/10">
                                        3 / {target}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl">
                            <div className="flex gap-4">
                                <div className="bg-primary/20 p-2 rounded-lg h-fit text-primary">
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Dica de Retenção</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Programas com metas entre 8 e 12 pontos convertem 40% mais. Tente manter o prêmio simples e desejável, como um corte grátis ou hidratação premium.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FeatureGate>
    );
};
