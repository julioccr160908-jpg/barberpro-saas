
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { DayConfig, ShopSettings } from '../types';
import { Clock, Check, AlertCircle, Loader2, MapPin, Store, Phone, Building } from 'lucide-react';
import { db } from '../services/database';

export const AdminTimeSettings: React.FC = () => {
    const [schedule, setSchedule] = useState<DayConfig[]>([]);
    const [intervalMinutes, setIntervalMinutes] = useState(30);

    // Location State
    const [establishmentName, setEstablishmentName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');

    const [activeTab, setActiveTab] = useState<'general' | 'schedule'>('general');

    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Initial load
    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                const data = await db.settings.get();
                if (data) {
                    setSchedule(data.schedule || []);
                    setIntervalMinutes(data.intervalMinutes || 30);
                    setEstablishmentName(data.establishmentName || '');
                    setAddress(data.address || '');
                    setPhone(data.phone || '');
                    setCity(data.city || '');
                    setState(data.state || '');
                    setZipCode(data.zipCode || '');
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
                intervalMinutes,
                schedule,
                establishmentName,
                address,
                phone,
                city,
                state,
                zipCode
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving settings", error);
            alert("Erro ao salvar configurações.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-white animate-pulse">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p>Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-textMain tracking-tight">Configurações Gerais</h2>
                    <p className="text-textMuted mt-1">Gerencie os dados do estabelecimento e horários.</p>
                </div>

                {/* Global Interval Setting */}
                {activeTab === 'schedule' && (
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
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 mb-8">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'general' ? 'text-primary' : 'text-textMuted hover:text-white'}`}
                >
                    Dados do Estabelecimento
                    {activeTab === 'general' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'schedule' ? 'text-primary' : 'text-textMuted hover:text-white'}`}
                >
                    Horários de Funcionamento
                    {activeTab === 'schedule' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                </button>
            </div>

            {activeTab === 'general' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-xl border border-white/5 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-textMuted">Nome do Estabelecimento</label>
                        <div className="relative">
                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                            <input
                                type="text"
                                value={establishmentName}
                                onChange={(e) => setEstablishmentName(e.target.value)}
                                className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="Ex: Barbearia do Júlio"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-textMuted">Telefone / WhatsApp</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-textMuted">CEP</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                            <input
                                type="text"
                                value={zipCode}
                                onChange={(e) => setZipCode(e.target.value)}
                                className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="00000-000"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-textMuted">Endereço Completo</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="Rua, Número, Bairro"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-textMuted">Cidade</label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="Cidade"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-textMuted">Estado (UF)</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                            <input
                                type="text"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="SP"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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
            )}

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
                    disabled={saving}
                >
                    {saving ? <Loader2 size={24} className="animate-spin" /> : 'Salvar Alterações'}
                </Button>
            </div>
        </div>
    );
};
