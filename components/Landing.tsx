import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { useSettings } from '../contexts/SettingsContext';
import { MapPin } from 'lucide-react';
import { LandingSearch } from './LandingSearch';

export const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();

    const handleOpenMaps = () => {
        if (!settings.address) return;
        const fullAddress = `${settings.address}, ${settings.city || ''} - ${settings.state || ''}`;
        const encodedAddress = encodeURIComponent(fullAddress);
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

            <div className="relative z-10 text-center max-w-lg p-8 w-full">
                <h1 className="text-6xl font-display font-bold text-white mb-2 tracking-tighter">BARBER<span className="text-primary">HOST</span></h1>
                <p className="text-textMuted mb-12 text-lg">Sistema de Gestão Premium para Barbearias</p>

                <div className="space-y-8 w-full">
                    {/* Search Section */}
                    <div className="space-y-4">
                        <LandingSearch />
                        <p className="text-sm text-textMuted">ou acesse diretamente</p>
                    </div>

                    <div className="space-y-4">
                        <Button fullWidth size="lg" onClick={() => navigate('/login?role=admin')}>
                            Entrar como Dono (Admin)
                        </Button>

                        <div className="pt-2">
                            <Button fullWidth size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => navigate('/register')}>
                                Cadastrar sua Barbearia
                            </Button>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-xs text-white/30">Versão Demo v1.0.0</p>
            </div>
        </div>
    );
};
