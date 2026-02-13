import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, User, LogOut, Scissors, Menu, MapPin } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { Button } from '../ui/Button';

interface CustomerLayoutProps {
    children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const { settings } = useSettings();

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
    } as React.CSSProperties), [settings]);

    return (
        <div className="min-h-screen bg-background text-textMain font-sans flex flex-col" style={brandingStyles}>
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background z-50 relative">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: settings.primary_color || '#D4AF37' }}>
                        <Scissors size={18} className="text-black" />
                    </div>
                    <span className="font-display font-bold text-lg text-white">BARBER<span style={{ color: settings.primary_color || '#D4AF37' }}>HOST</span></span>
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
                                <span className="font-display font-bold text-xl tracking-wider text-white">BARBER<span style={{ color: settings.primary_color || '#D4AF37' }}>HOST</span></span>
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
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'text-textMuted hover:text-white hover:bg-surfaceHighlight'}
                    `}
                                    >
                                        <item.icon size={18} />
                                        {item.label}
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
