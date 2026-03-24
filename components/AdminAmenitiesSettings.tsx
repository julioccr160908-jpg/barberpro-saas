import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useSettings } from '../contexts/SettingsContext';
import { toast } from 'sonner';
import { 
    Loader2, Wifi, Coffee, Gamepad2, Tv, Snowflake, Beer, Car, Cigarette, 
    GlassWater, CheckCircle2, Music, PawPrint, Flame, Accessibility, 
    CreditCard, QrCode, Dices, Plus, X, Trash2, Scissors, Dumbbell, 
    Laptop, Utensils, Sofa, Baby, Heart, Star, Camera, MapPin, Search, HelpCircle,
    Wine, Pizza, Cookie, Sandwich, IceCream, Martini, MonitorPlay, Trophy, Disc, Radio, 
    Mic, Speaker, Wind, Phone, Tablet, Smartphone, Sparkles, Brush, Shirt, Ruler, 
    ShoppingBag, Tag, Watch, Award, Zap, Shield, Sun, Moon, Bell, Smile, Eye, ParkingCircle, Dog
} from 'lucide-react';

// Unified icon map for Lucide components
const ICON_MAP: Record<string, any> = {
    Wifi, Coffee, Beer, GlassWater, Snowflake, Car, Tv, Gamepad2, 
    Dices, Music, PawPrint, Flame, Accessibility, CreditCard, 
    QrCode, Cigarette, Scissors, Dumbbell, Laptop, Utensils, 
    Sofa, Baby, Heart, Star, Camera, MapPin, HelpCircle,
    Wine, Pizza, Cookie, Sandwich, IceCream, Martini, MonitorPlay, 
    Trophy, Disc, Radio, Mic, Speaker, Wind, Phone, Tablet, 
    Smartphone, Sparkles, Brush, Shirt, Ruler, ShoppingBag, 
    Tag, Watch, Award, Zap, Shield, Sun, Moon, Bell, Smile, Eye, 
    ParkingCircle, Dog
};

const ICON_LIBRARY = [
  {
    category: 'Bebidas & Gastronomia',
    icons: ['Coffee', 'Beer', 'Wine', 'GlassWater', 'Utensils', 'Pizza', 'Cookie', 'Sandwich', 'IceCream', 'Martini']
  },
  {
    category: 'Entretenimento',
    icons: ['Gamepad2', 'Tv', 'Music', 'MonitorPlay', 'Dumbbell', 'Trophy', 'Disc', 'Radio', 'Mic', 'Speaker']
  },
  {
    category: 'Conforto & Facilidades',
    icons: ['Wifi', 'Wind', 'Sofa', 'ParkingCircle', 'Baby', 'Accessibility', 'Laptop', 'Snowflake', 'Flame', 'Car', 'MapPin', 'Phone', 'Tablet', 'Smartphone']
  },
  {
    category: 'Estilo & Barba',
    icons: ['Scissors', 'Sparkles', 'Brush', 'Shirt', 'Ruler', 'ShoppingBag', 'Tag', 'Watch']
  },
  {
    category: 'Outros',
    icons: ['Cigarette', 'Dog', 'CreditCard', 'QrCode', 'Heart', 'Star', 'Award', 'Zap', 'Camera', 'Shield', 'Sun', 'Moon', 'Bell', 'Smile', 'Eye']
  }
];

export const AVAILABLE_AMENITIES = [
    { id: 'wifi', label: 'Wi-Fi Grátis', icon: 'Wifi' },
    { id: 'coffee', label: 'Café', icon: 'Coffee' },
    { id: 'beer', label: 'Cerveja Gelada', icon: 'Beer' },
    { id: 'water', label: 'Água / Bebidas', icon: 'GlassWater' },
    { id: 'ac', label: 'Ar Condicionado', icon: 'Snowflake' },
    { id: 'parking', label: 'Estacionamento', icon: 'Car' },
    { id: 'tv', label: 'TV / Esportes', icon: 'Tv' },
    { id: 'gamepad', label: 'Videogame', icon: 'Gamepad2' },
    { id: 'pool_table', label: 'Sinuca / Jogos', icon: 'Dices' },
    { id: 'music', label: 'Som Ambiente', icon: 'Music' },
    { id: 'pet_friendly', label: 'Pet Friendly', icon: 'PawPrint' },
    { id: 'hot_towel', label: 'Toalha Quente', icon: 'Flame' },
    { id: 'accessibility', label: 'Acessibilidade', icon: 'Accessibility' },
    { id: 'credit_card', label: 'Aceita Cartão', icon: 'CreditCard' },
    { id: 'pix', label: 'Aceita Pix', icon: 'QrCode' },
    { id: 'smoking_area', label: 'Área de Fumantes', icon: 'Cigarette' },
];

interface CustomAmenity {
    id: string;
    label: string;
    icon: string;
}

export const AdminAmenitiesSettings: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [customAmenities, setCustomAmenities] = useState<CustomAmenity[]>([]);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAmenity, setNewAmenity] = useState({ label: '', icon: 'Star' });

    useEffect(() => {
        if (settings?.amenities) {
            setSelectedAmenities(settings.amenities);
        }
        if (settings?.custom_amenities) {
            setCustomAmenities(settings.custom_amenities as CustomAmenity[]);
        }
    }, [settings]);

    const toggleAmenity = (id: string) => {
        setSelectedAmenities(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleAddCustom = () => {
        if (!newAmenity.label) return toast.error('Dê um nome para a comodidade');
        
        const id = `custom_${Date.now()}`;
        const updatedCustoms = [...customAmenities, { id, ...newAmenity }];
        
        setCustomAmenities(updatedCustoms);
        setSelectedAmenities(prev => [...prev, id]);
        setIsModalOpen(false);
        setNewAmenity({ label: '', icon: 'Star' });
        toast.success(`'${newAmenity.label}' adicionada!`);
    };

    const handleDeleteCustom = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setCustomAmenities(prev => prev.filter(a => a.id !== id));
        setSelectedAmenities(prev => prev.filter(itemId => itemId !== id));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings({
                ...settings,
                amenities: selectedAmenities,
                custom_amenities: customAmenities
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-display font-bold text-white mb-1">Comodidades e Diferenciais</h2>
                    <p className="text-sm text-textMuted">
                        Destaque o que sua barbearia oferece além do corte.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {/* Standard Amenities */}
                {AVAILABLE_AMENITIES.map(amenity => {
                    const Icon = ICON_MAP[amenity.icon] || Star;
                    const isSelected = selectedAmenities.includes(amenity.id);
                    return (
                        <div
                            key={amenity.id}
                            onClick={() => toggleAmenity(amenity.id)}
                            className={`
                                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                                flex flex-col items-center justify-center gap-3 text-center group
                                ${isSelected
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/5 bg-background hover:border-white/20'}
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2 text-primary animate-in zoom-in duration-300">
                                    <CheckCircle2 size={16} className="fill-primary/20" />
                                </div>
                            )}
                            <Icon size={24} strokeWidth={1.5} className={isSelected ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300'} />
                            <span className={`text-xs font-medium tracking-tight ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                                {amenity.label}
                            </span>
                        </div>
                    );
                })}

                {/* Custom User Amenities */}
                {customAmenities.map(amenity => {
                    const Icon = ICON_MAP[amenity.icon] || Star;
                    const isSelected = selectedAmenities.includes(amenity.id);
                    return (
                        <div
                            key={amenity.id}
                            onClick={() => toggleAmenity(amenity.id)}
                            className={`
                                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                                flex flex-col items-center justify-center gap-3 text-center group
                                ${isSelected
                                    ? 'border-primary bg-primary/10 shadown-[0_0_15px_rgba(212,175,55,0.1)]'
                                    : 'border-white/5 bg-background hover:border-white/20'}
                            `}
                        >
                            <button 
                                onClick={(e) => handleDeleteCustom(e, amenity.id)}
                                className="absolute top-2 left-2 p-1 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                            
                            {isSelected && (
                                <div className="absolute top-2 right-2 text-primary animate-in zoom-in duration-300">
                                    <CheckCircle2 size={16} className="fill-primary/20" />
                                </div>
                            )}
                            <Icon size={24} strokeWidth={1.5} className={isSelected ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300'} />
                            <span className={`text-xs font-medium tracking-tight ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                                {amenity.label}
                            </span>
                        </div>
                    );
                })}

                {/* Add New Card */}
                <div
                    onClick={() => setIsModalOpen(true)}
                    className="p-4 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 group"
                >
                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={20} className="text-zinc-500 group-hover:text-primary" />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300 tracking-tight">Personalizada</span>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-black hover:bg-primary/90 min-w-[180px] font-bold shadow-lg shadow-primary/10">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Salvar Alterações'}
                </Button>
            </div>

            {/* Creation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-display font-bold text-white tracking-tight">Nova Comodidade</h3>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Personalize seu diferencial</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2 px-1">Nome da Comodidade</label>
                                <input 
                                    type="text"
                                    value={newAmenity.label}
                                    onChange={(e) => setNewAmenity({...newAmenity, label: e.target.value})}
                                    placeholder="Ex: Charutaria, Café Gourmet..."
                                    className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4 px-1">Selecione um Ícone</label>
                                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {ICON_LIBRARY.map((group) => (
                                        <div key={group.category} className="space-y-3">
                                            <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] px-1 px-1 flex items-center gap-2">
                                                <div className="h-px flex-1 bg-white/5"></div>
                                                {group.category}
                                                <div className="h-px flex-1 bg-white/5"></div>
                                            </h4>
                                            <div className="grid grid-cols-5 gap-2 p-2 bg-black/20 rounded-[1.5rem] border border-white/5">
                                                {group.icons.map(iconName => {
                                                    const Icon = ICON_MAP[iconName] || HelpCircle;
                                                    const isSelected = newAmenity.icon === iconName;
                                                    return (
                                                        <button
                                                            key={iconName}
                                                            type="button"
                                                            onClick={() => setNewAmenity({...newAmenity, icon: iconName})}
                                                            className={`
                                                                relative p-3 rounded-xl transition-all duration-300 flex items-center justify-center group/icon
                                                                ${isSelected 
                                                                    ? 'bg-primary text-black shadow-xl scale-110 shadow-primary/20 z-10' 
                                                                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'}
                                                            `}
                                                        >
                                                            <Icon size={18} strokeWidth={isSelected ? 2 : 1.5} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button 
                                onClick={handleAddCustom}
                                className="w-full py-6 rounded-2xl bg-primary text-black font-bold tracking-widest uppercase text-xs hover:brightness-110 shadow-xl shadow-primary/10 transition-all mt-4"
                            >
                                Adicionar à Grid
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};
