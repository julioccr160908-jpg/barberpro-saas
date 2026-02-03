
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { DayConfig } from '../types';
import { Clock, Check, AlertCircle, Loader2, Save } from 'lucide-react';
import { db } from '../services/database';
import { toast } from 'sonner';

export const AdminTimeSettings: React.FC = () => {
    const [schedule, setSchedule] = useState<DayConfig[]>([]);
    const [intervalMinutes, setIntervalMinutes] = useState(30);

    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Initial load
    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                const settingsData = await db.settings.get();
                if (settingsData) {
                    setSchedule(settingsData.schedule || []);
                    setIntervalMinutes(settingsData.interval_minutes || 30);
                }
            } catch (error) {
                console.error("Failed to load settings", error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const days = [
        { id: 0, label: 'Domingo' },
        { id: 1, label: 'Segunda-feira' },
        { id: 2, label: 'Terça-feira' },
        { id: 3, label: 'Quarta-feira' },
        { id: 4, label: 'Quinta-feira' },
        { id: 5, label: 'Sexta-feira' },
        { id: 6, label: 'Sábado' },
    ];

    const handleDayUpdate = (dayId: number, field: keyof DayConfig, value: any) => {
        setSchedule(prev => {
            // Check if day exists in schedule
            const exists = prev.find(d => d.dayId === dayId);
            if (exists) {
                return prev.map(day => day.dayId === dayId ? { ...day, [field]: value } : day);
            } else {
                // If not exists (fetched empty), create it
                const newDay: DayConfig = {
                    dayId,
                    isOpen: false,
                    openTime: '09:00',
                    closeTime: '18:00',
                    [field]: value
                } as DayConfig;
                return [...prev, newDay];
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await db.settings.update({
                interval_minutes: intervalMinutes,
                schedule
            });
            setSuccess(true);
            toast.success("Horários salvos com sucesso!");
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            console.error(e);
            toast.error("Erro ao salvar horários.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-white animate-pulse">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p>Carregando horários...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn pb-20 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Horários de Funcionamento</h2>
                    <p className="text-textMuted mt-1">Defina quando sua barbearia está aberta.</p>
                </div>

                {/* Global Interval Setting */}
                <div className="flex items-center gap-4 bg-surface px-4 py-2 rounded-lg border border-white/5">
                    <label className="text-sm font-medium text-textMuted uppercase">Intervalo Padrão</label>
                    <select
                        value={intervalMinutes}
                        onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                        className="bg-background border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                    </select>
                </div>
            </div>

            {/* Schedule List */}
            <div className="space-y-4">
                {days.map(dayLabel => {
                    const config = schedule.find(d => d.dayId === dayLabel.id) || {
                        dayId: dayLabel.id,
                        isOpen: false,
                        openTime: '09:00',
                        closeTime: '18:00'
                    };

                    return (
                        <div
                            key={dayLabel.id}
                            className={`
                                group relative overflow-hidden rounded-xl border transition-all duration-300
                                ${config.isOpen
                                    ? 'bg-surface border-white/10 shadow-lg'
                                    : 'bg-surface/50 border-transparent opacity-75 hover:opacity-100'}
                            `}
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary transform origin-left transition-transform duration-300 scale-y-0 group-hover:scale-y-100"></div>

                            <div className="p-6 flex flex-col lg:flex-row gap-6 lg:items-center">
                                {/* Day Toggle & Label */}
                                <div className="flex items-center gap-4 min-w-[180px]">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={config.isOpen}
                                            onChange={(e) => handleDayUpdate(dayLabel.id, 'isOpen', e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                    <span className={`font-medium ${config.isOpen ? 'text-white' : 'text-textMuted'}`}>
                                        {dayLabel.label}
                                    </span>
                                </div>

                                {/* Hours Config */}
                                {config.isOpen ? (
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                                        <div className="space-y-1">
                                            <span className="text-xs text-textMuted uppercase tracking-wider">Abertura</span>
                                            <div className="relative">
                                                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                                                <input
                                                    type="time"
                                                    value={config.openTime}
                                                    onChange={(e) => handleDayUpdate(dayLabel.id, 'openTime', e.target.value)}
                                                    className="w-full bg-background border border-white/10 rounded px-3 pl-9 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-xs text-textMuted uppercase tracking-wider">Fechamento</span>
                                            <div className="relative">
                                                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                                                <input
                                                    type="time"
                                                    value={config.closeTime}
                                                    onChange={(e) => handleDayUpdate(dayLabel.id, 'closeTime', e.target.value)}
                                                    className="w-full bg-background border border-white/10 rounded px-3 pl-9 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-xs text-textMuted uppercase tracking-wider">Início Pausa</span>
                                            <input
                                                type="time"
                                                value={config.breakStart || ''}
                                                onChange={(e) => handleDayUpdate(dayLabel.id, 'breakStart', e.target.value)}
                                                className="w-full bg-background border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder-white/20"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-xs text-textMuted uppercase tracking-wider">Fim Pausa</span>
                                            <input
                                                type="time"
                                                value={config.breakEnd || ''}
                                                onChange={(e) => handleDayUpdate(dayLabel.id, 'breakEnd', e.target.value)}
                                                className="w-full bg-background border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder-white/20"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 text-sm text-textMuted flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        Fechado neste dia
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end pt-6 border-t border-white/10">
                <Button
                    onClick={handleSave}
                    size="lg"
                    className="shadow-2xl shadow-primary/20 hover:scale-105 transition-transform"
                    disabled={saving}
                >
                    {saving ? <Loader2 size={24} className="animate-spin" /> : (
                        <>
                            {success ? <Check className="mr-2" /> : <Save className="mr-2" />}
                            {success ? 'Salvo!' : 'Salvar Horários'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
