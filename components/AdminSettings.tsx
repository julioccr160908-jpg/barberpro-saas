
import React, { useState } from 'react';
import { Clock, Palette, Store, Bell } from 'lucide-react';
import { AdminTimeSettings } from './AdminTimeSettings';
import { AdminAppearanceSettings } from './AdminAppearanceSettings';
import { AdminGeneralSettings } from './AdminGeneralSettings';
import { AdminNotificationSettings } from './admin/AdminNotificationSettings';

type Tab = 'general' | 'schedule' | 'appearance' | 'notifications';

export const AdminSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('general');

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Configurações</h1>
                <p className="text-textMuted">Gerencie sua barbearia em um só lugar.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`
            flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${activeTab === 'general'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-textMuted hover:text-white hover:bg-white/5'}
          `}
                >
                    <Store size={18} />
                    Dados
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`
            flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${activeTab === 'schedule'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-textMuted hover:text-white hover:bg-white/5'}
          `}
                >
                    <Clock size={18} />
                    Horários
                </button>
                <button
                    onClick={() => setActiveTab('appearance')}
                    className={`
            flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${activeTab === 'appearance'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-textMuted hover:text-white hover:bg-white/5'}
          `}
                >
                    <Palette size={18} />
                    Aparência
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`
            flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${activeTab === 'notifications'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-textMuted hover:text-white hover:bg-white/5'}
          `}
                >
                    <Bell size={18} />
                    Notificações
                </button>
            </div>

            {/* Content */}
            <div className="pt-4">
                {activeTab === 'general' && <AdminGeneralSettings />}
                {activeTab === 'schedule' && <AdminTimeSettings />}
                {activeTab === 'appearance' && <AdminAppearanceSettings />}
                {activeTab === 'notifications' && <AdminNotificationSettings />}
            </div>
        </div>
    );
};
