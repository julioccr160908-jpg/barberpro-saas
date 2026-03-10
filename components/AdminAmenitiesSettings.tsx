import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useSettings } from '../contexts/SettingsContext';
import { toast } from 'sonner';
import { Loader2, Wifi, Coffee, Gamepad2, Tv, Snowflake, Beer, Car, Cigarette, GlassWater, CheckCircle2 } from 'lucide-react';

export const AVAILABLE_AMENITIES = [
    { id: 'wifi', label: 'Wi-Fi Grátis', icon: Wifi },
    { id: 'coffee', label: 'Café', icon: Coffee },
    { id: 'beer', label: 'Cerveja Gelada', icon: Beer },
    { id: 'water', label: 'Água / Bebidas', icon: GlassWater },
    { id: 'ac', label: 'Ar Condicionado', icon: Snowflake },
    { id: 'parking', label: 'Estacionamento', icon: Car },
    { id: 'tv', label: 'TV / Esportes', icon: Tv },
    { id: 'gamepad', label: 'Videogame / Sinuca', icon: Gamepad2 },
    { id: 'smoking_area', label: 'Área de Fumantes', icon: Cigarette },
];

export const AdminAmenitiesSettings: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    useEffect(() => {
        if (settings?.amenities) {
            setSelectedAmenities(settings.amenities);
        }
    }, [settings]);

    const toggleAmenity = (id: string) => {
        setSelectedAmenities(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings({
                ...settings,
                amenities: selectedAmenities
            });
            toast.success('Comodidades salvas com sucesso!');
        } catch (error) {
            console.error('Error saving amenities', error);
            toast.error('Erro ao salvar as comodidades.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="p-6 bg-surface/50 border-white/5 animate-fade-in relative overflow-hidden">
            <h2 className="text-xl font-display font-bold text-white mb-2">Comodidades Oferecidas</h2>
            <p className="text-sm text-textMuted mb-6">
                Selecione as comodidades que sua barbearia oferece. Elas serão exibidas na sua página de agendamento público para atrair mais clientes.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {AVAILABLE_AMENITIES.map(amenity => {
                    const Icon = amenity.icon;
                    const isSelected = selectedAmenities.includes(amenity.id);
                    return (
                        <div
                            key={amenity.id}
                            onClick={() => toggleAmenity(amenity.id)}
                            className={`
                                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                flex flex-col items-center justify-center gap-3 text-center
                                ${isSelected 
                                    ? 'border-primary bg-primary/10 select-none' 
                                    : 'border-white/5 bg-background hover:border-white/20 select-none'}
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2 text-primary">
                                    <CheckCircle2 size={16} className="fill-primary/20" />
                                </div>
                            )}
                            <Icon size={28} className={isSelected ? 'text-primary' : 'text-zinc-500'} />
                            <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                                {amenity.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-black hover:bg-primary/90 w-full sm:w-auto min-w-[150px]">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Salvar Comodidades'}
                </Button>
            </div>
        </Card>
    );
};
