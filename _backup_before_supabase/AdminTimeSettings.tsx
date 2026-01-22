import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from './ui/Button';
import { DayConfig } from '../types';
import { Clock, Check, AlertCircle } from 'lucide-react';

export const AdminTimeSettings: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [schedule, setSchedule] = useState<DayConfig[]>(settings.schedule || []);
    const [intervalMinutes, setIntervalMinutes] = useState(settings.intervalMinutes);
    const [success, setSuccess] = useState(false);

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
        setSchedule(prev => prev.map(day =>
            day.dayId === dayId ? { ...day, [field]: value } : day
        ));
    };

    const handleSave = () => {
        updateSettings({
            intervalMinutes,
            schedule
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-textMain tracking-tight">Configurações de Horário</h2>
                    <p className="text-textMuted mt-1">Defina o funcionamento detalhado para cada dia da semana.</p>
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

            <div className="fixed bottom-6 right-6 z-50">
                {success && (
                    <div className="absolute bottom-full right-0 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg backdrop-blur-md flex items-center gap-2 shadow-xl mb-2 animate-in slide-in-from-bottom-2">
                        <Check size={16} />
                        Configurações salvas com sucesso!
                    </div>
                )}
                <Button
                    onClick={handleSave}
                    size="lg"
                    className="shadow-2xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                    Salvar Alterações
                </Button>
            </div>
        </div>
    );
};
