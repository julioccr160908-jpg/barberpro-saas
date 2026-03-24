import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, User, LogOut, Scissors, Menu, MapPin, CreditCard, Star, UserCircle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

interface CustomerLayoutProps {
    children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const { settings } = useSettings();

    // Fetch Subscription Status for VIP badge
    const { data: subscription } = useQuery({
        queryKey: ['customer-subscription-sidebar', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data } = await supabase
                .from('customer_subscriptions')
                .select('id')
                .eq('customer_id', user.id)
                .is('canceled_at', null)
                .maybeSingle();
            return data;
        },
        enabled: !!user
    });

    const handleOpenMaps = () => {
        if (!settings.address) return;
        const fullAddress = `${settings.address}, ${settings.city || ''} - ${settings.state || ''}`;
        const encodedAddress = encodeURIComponent(fullAddress);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
    };

    const lastSlug = localStorage.getItem('barberhost_last_slug');
    const bookPath = lastSlug ? `/${lastSlug}` : '/book';

    const menuItems = [
        { id: 'book', label: 'Novo Agendamento', icon: Scissors, path: bookPath },
        { id: 'subscriptions', label: 'Clube de Assinatura', icon: CreditCard, path: '/customer/subscriptions' },
        { id: 'appointments', label: 'Meus Agendamentos', icon: Calendar, path: '/customer/appointments' },
        { id: 'profile', label: 'Meu Perfil', icon: User, path: '/customer/profile' },
    ];

    const handleLogout = () => {
        // AuthContext usually handles actual logout state, but we force nav here
        // In a real app calling signOut() from supabase is better
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login');
    }

    const brandingStyles = React.useMemo(() => ({
        '--primary': settings.primary_color || '#D4AF37',
        '--secondary': settings.secondary_color || '#1A1A1A',
        '--color-primary': settings.primary_color || '#D4AF37',
        '--color-secondary': settings.secondary_color || '#1A1A1A',
    } as React.CSSProperties), [settings]);

    return (
        <div className="min-h-screen bg-background text-textMain font-sans flex flex-col" style={brandingStyles}>
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background z-50 relative">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: settings.primary_color || '#D4AF37' }}>
                        <Scissors size={18} className="text-black" />
                    </div>
                    <span className="font-display font-bold text-lg text-white">{settings.establishment_name || 'Barbearia'}</span>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
                    <Menu />
                </button>
            </div>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Sidebar / Drawer */}
                <aside className={`
            fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:block pt-20 lg:pt-0
        `}>
                    <div className="flex flex-col h-full">
                        {/* Logo Desktop */}
                        <div className="hidden lg:flex h-20 items-center px-6 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: settings.primary_color || '#D4AF37' }}>
                                    <Scissors size={18} className="text-black" />
                                </div>
                                <span className="font-display font-bold text-xl tracking-wider text-white">{settings.establishment_name || 'Barbearia'}</span>
                            </div>
                        </div>

                        {/* User Profile Section */}
                        <div className="p-6 border-b border-border flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden shrink-0 relative">
                                {profile?.avatarUrl ? (
                                    <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-zinc-500">
                                        <User size={24} />
                                    </div>
                                )}
                                {subscription && (
                                    <div className="absolute -bottom-1 -right-1 bg-primary w-4 h-4 rounded-full flex items-center justify-center border-2 border-surface">
                                        <Star size={8} className="text-black fill-current" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-white truncate">{profile?.name || 'Cliente'}</h3>
                                {subscription ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-tighter">
                                        <Star size={8} className="fill-current" />
                                        VIP Member
                                    </span>
                                ) : (
                                    <p className="text-[10px] text-zinc-500 font-medium uppercase truncate">Cliente Bronze</p>
                                )}
                            </div>
                        </div>

                        <nav className="flex-1 px-4 py-8 space-y-2">
                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            navigate(item.path);
                                            setIsOpen(false);
                                        }}
                                        className={`
                                            w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group
                                            ${isActive
                                                ? 'shadow-lg shadow-primary/10'
                                                : 'text-zinc-500 hover:text-white hover:bg-white/5'}
                                        `}
                                        style={isActive ? { 
                                            backgroundColor: (settings.primary_color || '#D4AF37') + '1a', 
                                            color: settings.primary_color || '#D4AF37',
                                            borderColor: (settings.primary_color || '#D4AF37') + '33'
                                        } : {}}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={18} className={isActive ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300'} />
                                            <span>{item.label}</span>
                                        </div>
                                        {item.id === 'subscriptions' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-border space-y-4">
                            {/* Location Box */}
                            {settings.address && (
                                <div className="bg-background/50 rounded-lg p-3 border border-white/5">
                                    <div className="flex items-start gap-2 mb-2">
                                        <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                                        <div className="text-xs text-textMuted">
                                            <p className="font-medium text-white mb-1">{settings.establishment_name || 'Barbearia'}</p>
                                            <p>{settings.address}</p>
                                            <p>{settings.city} - {settings.state}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        fullWidth
                                        onClick={handleOpenMaps}
                                        className="h-8 text-xs border-white/10 hover:border-primary/50"
                                    >
                                        Como Chegar
                                    </Button>
                                </div>
                            )}

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-textMuted hover:text-red-500 transition-colors"
                            >
                                <LogOut size={18} />
                                Sair
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Backdrop for mobile */}
                {isOpen && (
                    <div className="fixed inset-0 bg-black/80 z-30 lg:hidden" onClick={() => setIsOpen(false)} />
                )}

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
