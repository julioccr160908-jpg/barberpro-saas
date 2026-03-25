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
        <div className="h-screen overflow-hidden bg-black text-textMain font-sans flex flex-col" style={brandingStyles}>
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
            fixed lg:relative inset-y-0 left-0 z-40 w-64 h-full bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out overflow-hidden flex-none
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:block
        `}>
                    <div className="flex flex-col h-full">
                        {/* Logo Desktop - Compact Original DNA */}
                        <div className="hidden lg:flex h-16 items-center px-6 border-b border-zinc-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded flex items-center justify-center bg-primary shadow-lg shadow-primary/20" style={{ backgroundColor: settings.primary_color || '#D4AF37' }}>
                                    <Scissors size={18} className="text-black" />
                                </div>
                                <span className="font-display font-bold text-xl tracking-tight text-white uppercase">{settings.establishment_name || 'Barbearia'}</span>
                            </div>
                        </div>

                        {/* User Profile Section - Compact Original Style */}
                        <div className="p-3 lg:p-4 border-b border-zinc-800 flex items-center gap-3 bg-white/5 active:bg-white/10 cursor-pointer transition-colors shrink-0" onClick={() => navigate('/customer/profile')}>
                            <UserAvatar 
                                src={profile?.avatarUrl} 
                                name={profile?.name} 
                                size="md" 
                                vip={!!subscription}
                                className={subscription ? 'ring-1 ring-primary/40' : 'border-zinc-800'}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-sm font-bold text-white truncate tracking-tight">{profile?.name || 'Cliente'}</h3>
                                    {subscription && <Star size={10} className="text-primary fill-current" />}
                                </div>
                                {subscription ? (
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">VIP Membership</p>
                                ) : (
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight truncate">Plano Exclusive</p>
                                )}
                            </div>
                            <ChevronRight size={14} className="text-zinc-600" />
                        </div>

                        {/* Navigation - Compact Ergonomic */}
                        <nav className="flex-1 px-3 py-4 lg:py-6 space-y-1 overflow-y-auto min-h-0 custom-scrollbar">
                            <div className="mb-2 lg:mb-4">
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-3">Menu de Acesso</span>
                            </div>
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
                                            w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative
                                            ${isActive
                                                ? 'bg-primary/5 text-primary shadow-sm'
                                                : 'text-zinc-500 hover:text-white hover:bg-white/5'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={18} className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-zinc-600 group-hover:text-zinc-300'}`} />
                                            <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
                                        </div>
                                        
                                        {/* Active Indicator Bar - Discrete */}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
                                        )}
                                        
                                        {item.id === 'subscriptions' && !subscription && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Sticky Footer Area - Editorial Luxury */}
                        <div className="mt-auto p-6 border-t border-zinc-800 space-y-4 bg-black/20 backdrop-blur-xl shrink-0">
                            {/* Location Box - Premium Editorial Style */}
                            {settings.address && (
                                <div className="bg-zinc-800/20 rounded-xl p-3.5 border border-white/5 flex items-center justify-between gap-3 group hover:border-amber-500/20 transition-all duration-500 active:scale-[0.98]">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 bg-amber-500/10 rounded-lg shrink-0 border border-amber-500/10 group-hover:bg-amber-500/20 transition-all">
                                            <MapPin size={16} className="text-amber-500" />
                                        </div>
                                        <div className="text-[10px] text-zinc-500 truncate leading-relaxed">
                                            <p className="font-bold text-zinc-200 truncate uppercase tracking-widest">{settings.establishment_name || 'Barbearia'}</p>
                                            <p className="truncate opacity-50 font-medium">Localização Boutique</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleOpenMaps}
                                        className="h-8 w-8 p-0 flex items-center justify-center border-white/5 hover:bg-amber-500/10 text-zinc-500 hover:text-amber-500 transition-all rounded-full"
                                    >
                                        <ChevronRight size={14} />
                                    </Button>
                                </div>
                            )}
                            
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-[11px] text-zinc-500 hover:text-red-400 transition-all duration-500 rounded-xl hover:bg-red-500/5 group"
                            >
                                <div className="p-2 bg-zinc-800/30 rounded-lg group-hover:bg-red-500/10 transition-all">
                                    <LogOut size={16} />
                                </div>
                                <span className="font-bold uppercase tracking-[0.2em] opacity-80 group-hover:opacity-100">Encerrar Sessão</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Backdrop for mobile */}
                {isOpen && (
                    <div className="fixed inset-0 bg-black/80 z-30 lg:hidden" onClick={() => setIsOpen(false)} />
                )}

                {/* Content Area - Independent Scroll Original Spacing */}
                <main className="flex-1 h-full overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-black">
                    <div className="max-w-5xl mx-auto pb-20 lg:pb-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
