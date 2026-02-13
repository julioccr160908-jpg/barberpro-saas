import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Scissors, Loader2 } from 'lucide-react';
import { useOrganization } from '../../hooks/useOrganization';
import { useSettingsQuery } from '../../hooks/useSettingsQuery';

interface PublicBookingLayoutProps {
    children: React.ReactNode;
}

/**
 * Minimal public layout for booking pages
 * Fetches branding from URL slug to ensure correct display for guests
 */
export const PublicBookingLayout: React.FC<PublicBookingLayoutProps> = ({ children }) => {
    const { slug } = useParams<{ slug: string }>();

    // 1. Fetch Org
    const { data: org, isLoading: orgLoading } = useOrganization(slug);

    // 2. Fetch Settings (using org ID if available)
    const { data: settingsData, isLoading: settingsLoading } = useSettingsQuery(org?.id);

    // 3. Merge Branding
    const activeSettings = useMemo(() => {
        if (!org && !settingsData) return {}; // Fallback empty

        return {
            primary_color: org?.primary_color || settingsData?.primary_color || '#D4AF37',
            secondary_color: org?.secondary_color || settingsData?.secondary_color || '#1A1A1A',
            establishment_name: settingsData?.establishment_name || org?.name || 'BarberHost',
            logo_url: org?.logo_url || settingsData?.logo_url,
        };
    }, [org, settingsData]);

    const brandingStyles = useMemo(() => ({
        '--primary': activeSettings.primary_color || '#D4AF37',
        '--secondary': activeSettings.secondary_color || '#1A1A1A',
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
                            {activeSettings.logo_url ? (
                                <img src={activeSettings.logo_url} className="w-full h-full object-cover" alt="Logo" />
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
