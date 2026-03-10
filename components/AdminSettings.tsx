
import React, { useState } from 'react';
import { Clock, Palette, Store, Bell, User, MessageSquare, CreditCard, Coffee } from 'lucide-react';
import { AdminTimeSettings } from './AdminTimeSettings';
import { AdminAppearanceSettings } from './AdminAppearanceSettings';
import { AdminGeneralSettings } from './AdminGeneralSettings';
import { AdminNotificationSettings } from './admin/AdminNotificationSettings';
import { AdminProfileSettings } from './AdminProfileSettings';
import { AdminWhatsAppStatus } from './admin/AdminWhatsAppStatus';
import { SubscriptionPlans } from './admin/SubscriptionPlans';
import { AdminAmenitiesSettings } from './AdminAmenitiesSettings';
import { useSearchParams } from 'react-router-dom';

type Tab = 'general' | 'schedule' | 'appearance' | 'amenities' | 'notifications' | 'whatsapp' | 'profile' | 'subscription';

export const AdminSettings: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'general');

    React.useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['general', 'schedule', 'appearance', 'amenities', 'notifications', 'whatsapp', 'profile', 'subscription'].includes(tab)) {
            setActiveTab(tab as Tab);
        }
    }, [searchParams]);

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
                    onClick={() => setActiveTab('amenities')}
                    className={`
            flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${activeTab === 'amenities'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-textMuted hover:text-white hover:bg-white/5'}
          `}
                >
                    <Coffee size={18} />
                    Comodidades
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
                <button
                    onClick={() => setActiveTab('whatsapp')}
                    className={`
            flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${activeTab === 'whatsapp'
                            ? 'border-green-500 text-green-400'
                            : 'border-transparent text-textMuted hover:text-white hover:bg-white/5'}
          `}
                >
                    <MessageSquare size={18} />
                    WhatsApp
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`
            flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${activeTab === 'profile'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-textMuted hover:text-white hover:bg-white/5'}
          `}
                >
                    <User size={18} />
                    Perfil
                </button>
                <button
                    onClick={() => setActiveTab('subscription')}
                    className={`
            flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${activeTab === 'subscription'
                            ? 'border-amber-500 text-amber-400'
                            : 'border-transparent text-textMuted hover:text-white hover:bg-white/5'}
          `}
                >
                    <CreditCard size={18} />
                    Assinatura
                </button>
            </div>

            {/* Content */}
            <div className="pt-4">
                {activeTab === 'general' && <AdminGeneralSettings />}
                {activeTab === 'schedule' && <AdminTimeSettings />}
                {activeTab === 'appearance' && <AdminAppearanceSettings />}
                {activeTab === 'amenities' && <AdminAmenitiesSettings />}
                {activeTab === 'notifications' && <AdminNotificationSettings />}
                {activeTab === 'whatsapp' && <AdminWhatsAppStatus />}
                {activeTab === 'profile' && <AdminProfileSettings />}
                {activeTab === 'subscription' && <SubscriptionPlans />}
            </div>
        </div>
    );
};
