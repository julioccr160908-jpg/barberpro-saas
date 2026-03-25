import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, User, LogOut, Scissors, Menu, MapPin, CreditCard, Star, UserCircle, ChevronRight } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import { UserAvatar } from '../ui/UserAvatar';

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
                .eq('status', 'active')
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
                        {/* Logo Desktop - Compact */}
                        <div className="hidden lg:flex h-16 items-center px-6 border-b border-border bg-black/10">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ backgroundColor: settings.primary_color || '#D4AF37' }}>
                                    <Scissors size={15} className="text-black" />
                                </div>
                                <span className="font-display font-black text-lg tracking-tight text-white uppercase">{settings.establishment_name || 'Barbearia'}</span>
                            </div>
                        </div>

                        {/* User Profile Section - Compact Horizontal */}
                        <div className="p-4 border-b border-border flex items-center gap-3 bg-white/5 active:bg-white/10 cursor-pointer transition-colors shrink-0" onClick={() => navigate('/customer/profile')}>
                            <UserAvatar 
                                src={profile?.avatarUrl} 
                                name={profile?.name} 
                                size="md" 
                                vip={!!subscription}
                                className={subscription ? 'ring-2 ring-primary/50' : ''}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-sm font-bold text-white truncate">{profile?.name || 'Cliente'}</h3>
                                    {subscription && <Star size={10} className="text-primary fill-current" />}
                                </div>
                                {subscription ? (
                                    <p className="text-[10px] text-primary font-black uppercase tracking-tighter">VIP Member</p>
                                ) : (
                                    <p className="text-[10px] text-zinc-500 font-medium uppercase truncate">Plano Bronze</p>
                                )}
                            </div>
                            <UserCircle size={16} className="text-zinc-500 hover:text-white transition-colors" />
                        </div>

                        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                                            w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative
                                            ${isActive
                                                ? 'bg-primary/5 text-primary shadow-sm'
                                                : 'text-zinc-500 hover:text-white hover:bg-white/5'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'bg-white/5 text-zinc-500 group-hover:bg-white/10 group-hover:text-zinc-300'}`}>
                                                <item.icon size={16} />
                                            </div>
                                            <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
                                        </div>
                                        
                                        {/* Active Indicator Bar */}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                                        )}
                                        
                                        {item.id === 'subscriptions' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="mt-auto p-4 border-t border-border space-y-3 bg-surface/50 backdrop-blur-md">
                            {/* Location Box - Minimal */}
                            {settings.address && (
                                <div className="bg-background/40 rounded-xl p-3 border border-white/5 flex items-center justify-between gap-3 group hover:border-primary/20 transition-colors">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                                            <MapPin size={14} className="text-primary" />
                                        </div>
                                        <div className="text-[10px] text-textMuted truncate">
                                            <p className="font-bold text-white truncate">{settings.establishment_name || 'Barbearia'}</p>
                                            <p className="truncate opacity-70">{settings.address}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleOpenMaps}
                                        className="h-7 w-7 p-0 flex items-center justify-center border-white/5 hover:bg-primary/20 group-hover:text-primary transition-all"
                                    >
                                        <ChevronRight size={14} />
                                    </Button>
                                </div>
                            )}
                            
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-textMuted hover:text-red-500 transition-all rounded-lg hover:bg-red-500/5 group"
                            >
                                <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-red-500/10 transition-colors">
                                    <LogOut size={14} />
                                </div>
                                <span className="font-medium">Sair da Conta</span>
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
