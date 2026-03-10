import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Scissors, Loader2, User as UserIcon, Calendar, LogOut, LayoutDashboard } from 'lucide-react';
import { useOrganization } from '../../hooks/useOrganization';
import { useSettingsQuery } from '../../hooks/useSettingsQuery';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

interface PublicBookingLayoutProps {
    children: React.ReactNode;
}

/**
 * Minimal public layout for booking pages
 * Fetches branding from URL slug to ensure correct display for guests
 */
export const PublicBookingLayout: React.FC<PublicBookingLayoutProps> = ({ children }) => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user, profile, signOut, isAdmin } = useAuth();
    const [logoError, setLogoError] = React.useState(false);
    const [showUserMenu, setShowUserMenu] = React.useState(false);

    // 1. Fetch Org
    const { data: org, isLoading: orgLoading } = useOrganization(slug);

    // 2. Fetch Settings (using org ID if available)
    const { data: settingsData, isLoading: settingsLoading } = useSettingsQuery(org?.id);

    // 3. Merge Branding
    const activeSettings = useMemo(() => {
        if (!org && !settingsData) return {}; // Fallback empty

        return {
            primary_color: settingsData?.primary_color || org?.primary_color || '#D4AF37',
            secondary_color: settingsData?.secondary_color || org?.secondary_color || '#1A1A1A',
            establishment_name: settingsData?.establishment_name || org?.name || 'BarberHost',
            logo_url: settingsData?.logo_url || org?.logo_url,
        };
    }, [org, settingsData]);

    const brandingStyles = useMemo(() => ({
        '--primary': activeSettings.primary_color || '#D4AF37',
        '--secondary': activeSettings.secondary_color || '#1A1A1A',
        '--color-primary': activeSettings.primary_color || '#D4AF37',
        '--color-secondary': activeSettings.secondary_color || '#1A1A1A',
    } as React.CSSProperties), [activeSettings]);

    if (orgLoading || settingsLoading) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;
    }

    return (
        <div className="min-h-screen bg-background text-textMain font-sans flex flex-col" style={brandingStyles}>
            {/* Header */}
            <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden border border-white/10"
                            style={{ backgroundColor: activeSettings.primary_color || '#D4AF37' }}
                        >
                            {activeSettings.logo_url && !logoError ? (
                                <img src={activeSettings.logo_url} className="w-full h-full object-cover" alt="Logo" onError={() => setLogoError(true)} />
                            ) : (
                                <Scissors size={20} className="text-black" />
                            )}
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-xl text-white">
                                {activeSettings.establishment_name}
                            </h1>
                            <p className="text-xs text-textMuted">Agendamento Online</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full border border-primary/20 overflow-hidden">
                                        {profile?.avatarUrl ? (
                                            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-surfaceHighlight flex items-center justify-center text-textMuted">
                                                <UserIcon size={16} />
                                            </div>
                                        )}
                                    </div>
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in duration-200">
                                        <div className="p-4 border-b border-border">
                                            <p className="text-sm font-bold text-white truncate">{profile?.name || 'Usuário'}</p>
                                            <p className="text-xs text-textMuted truncate">{user.email}</p>
                                        </div>
                                        <div className="p-2">
                                            {isAdmin ? (
                                                <button
                                                    onClick={() => navigate('/admin/dashboard')}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-textMuted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                >
                                                    <LayoutDashboard size={16} /> Dashboard Principal
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => navigate('/customer/appointments')}
                                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-textMuted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                    >
                                                        <Calendar size={16} /> Meus Agendamentos
                                                    </button>
                                                    <button
                                                        onClick={() => navigate('/customer/profile')}
                                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-textMuted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                    >
                                                        <UserIcon size={16} /> Meu Perfil
                                                    </button>
                                                </>
                                            )}
                                            <div className="my-1 border-t border-border" />
                                            <button
                                                onClick={() => signOut()}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <LogOut size={16} /> Sair
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login">
                                <Button variant="ghost" size="sm">Entrar</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-surface/30 p-4 text-center text-xs text-textMuted">
                <p>© 2024 {activeSettings.establishment_name} — Todos os direitos reservados</p>
            </footer>
        </div>
    );
};
