import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Scissors } from 'lucide-react';

interface PublicBookingLayoutProps {
    children: React.ReactNode;
}

/**
 * Minimal public layout for booking pages
 * No authentication required, no sidebar navigation
 */
export const PublicBookingLayout: React.FC<PublicBookingLayoutProps> = ({ children }) => {
    const { settings } = useSettings();

    const brandingStyles = React.useMemo(() => ({
        '--primary': settings.primary_color || '#D4AF37',
        '--secondary': settings.secondary_color || '#1A1A1A',
    } as React.CSSProperties), [settings]);

    return (
        <div className="min-h-screen bg-background text-textMain font-sans flex flex-col" style={brandingStyles}>
            {/* Header */}
            <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: settings.primary_color || '#D4AF37' }}
                        >
                            <Scissors size={20} className="text-black" />
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-xl text-white">
                                {settings.establishment_name || 'BARBERPRO'}
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
                <p>© 2024 {settings.establishment_name || 'BarberPro'} — Todos os direitos reservados</p>
            </footer>
        </div>
    );
};
