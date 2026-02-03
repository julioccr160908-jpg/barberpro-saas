
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Gift, Save, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { db } from '../../services/database';
import { supabase } from '../../services/supabase';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

export const AdminLoyaltySettings: React.FC = () => {
    const { settings, updateSettings, isLoading: isContextLoading } = useSettings();
    const [enabled, setEnabled] = useState(false);
    const [target, setTarget] = useState(10);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (settings) {
            // Support both camelCase and snake_case from DB
            const newEnabled = settings.loyaltyEnabled || settings.loyalty_enabled || false;
            const newTarget = settings.loyaltyTarget || settings.loyalty_target || 10;

            setEnabled(newEnabled);
            setTarget(newTarget);
        }
    }, [settings]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // Update context (which handles DB update internally)
            // Send both naming conventions to ensure compatibility
            await updateSettings({
                ...settings,
                loyaltyEnabled: enabled,
                loyaltyTarget: target,
                loyalty_enabled: enabled,
                loyalty_target: target
            });

            toast.success('Configurações de fidelidade salvas!');
        } catch (error: any) {
            console.error('Erro ao salvar configurações de fidelidade:', error);
            toast.error(`Erro ao salvar: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isContextLoading) return <Loader2 className="animate-spin" />;

    return (
        <Card className="p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-lg">
                        <Gift className="text-primary" size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white">Programa de Fidelidade</h2>
                            {enabled && (
                                <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs font-semibold rounded-full animate-pulse">
                                    ● ATIVO
                                </span>
                            )}
                        </div>
                        <p className="text-textMuted">Configure as regras de recompensas para seus clientes.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Status Card */}
                {!enabled ? (
                    <div className="p-4 bg-background rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Ativar Programa</p>
                                <p className="text-sm text-textMuted">Os clientes ganharão pontos automaticamente.</p>
                            </div>
                            <Button onClick={() => setEnabled(true)} className="bg-primary text-black hover:bg-primary/80">
                                Ativar Agora
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-white font-medium">Programa Ativo</p>
                            </div>
                            <button
                                onClick={() => setEnabled(false)}
                                className="text-red-400 hover:text-red-300 text-sm font-medium underline"
                            >
                                Desativar Programa
                            </button>
                        </div>
                        <p className="text-sm text-textMuted">
                            Os clientes estão acumulando pontos automaticamente a cada serviço concluído.
                        </p>
                    </div>
                )}

                {/* Settings */}
                {enabled && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-sm text-textMuted mb-2">Meta de Cortes (para ganhar 1 grátis)</label>
                            <Input
                                type="number"
                                value={target}
                                onChange={(e) => setTarget(Number(e.target.value))}
                                className="bg-background border-white/10 text-white"
                                min={1}
                                max={50}
                            />
                            <p className="text-xs text-textMuted mt-1">Ex: A cada {target} cortes, o {target + 1}º é grátis.</p>
                        </div>
                    </div>
                )}

                <Button onClick={handleSave} disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                    Salvar Alterações
                </Button>
            </div>
        </Card>
    );
};
