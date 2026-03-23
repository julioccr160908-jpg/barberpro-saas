import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { useSettings } from '../contexts/SettingsContext';
import { toast } from 'sonner';
import { 
    Loader2, 
    Upload, 
    ImageIcon, 
    RefreshCw, 
    Clock, 
    Menu, 
    Maximize2, 
    Smartphone, 
    Monitor, 
    Wifi, 
    GlassWater, 
    Snowflake, 
    Gamepad2, 
    Dices, 
    QrCode, 
    Camera, 
    MapPin, 
    ChevronLeft,
    Tablet,
    Laptop
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

interface AppearanceForm {
    primary_color: string;
    secondary_color: string;
    establishment_name: string;
    banner_opacity: number;
}

export const AdminAppearanceSettings: React.FC = () => {
    const { settings, updateSettings, isLoading } = useSettings();
    const { organization, refreshOrganization } = useOrganization();

    // UI State
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');

    // Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [activeBucket, setActiveBucket] = useState<'logos' | 'banners' | null>(null);
    const [uploading, setUploading] = useState(false);

    const { register, handleSubmit, watch, setValue, reset } = useForm<AppearanceForm>({
        defaultValues: {
            primary_color: settings.primary_color || '#D4AF37',
            secondary_color: settings.secondary_color || '#1A1A1A',
            establishment_name: settings.establishment_name || 'Minha Barbearia',
            banner_opacity: settings.banner_opacity || 20
        }
    });

    const previewPrimary = watch('primary_color');
    const previewSecondary = watch('secondary_color');
    const previewName = watch('establishment_name');
    const previewOpacity = watch('banner_opacity');

    useEffect(() => {
        if (settings) {
            reset({
                primary_color: settings.primary_color || '#D4AF37',
                secondary_color: settings.secondary_color || '#1A1A1A',
                establishment_name: settings.establishment_name || '',
                banner_opacity: settings.banner_opacity || 20
            });
        }
    }, [settings, reset]);

    const onSubmit = async (data: AppearanceForm) => {
        setIsSaving(true);
        try {
            // Update Settings Table
            await updateSettings({
                ...settings,
                primary_color: data.primary_color,
                secondary_color: data.secondary_color,
                establishment_name: data.establishment_name,
                banner_opacity: data.banner_opacity
            });

            // Also Update Organization Table (Critical for Public Page Consistency)
            if (settings.organization_id) {
                const { error: orgError } = await supabase.from('organizations').update({
                    name: data.establishment_name,
                    primary_color: data.primary_color,
                    secondary_color: data.secondary_color
                }).eq('id', settings.organization_id);

                if (orgError) console.error("Error syncing organization colors", orgError);
            }

            toast.success('Aparência atualizada com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar aparência');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // 1. Select File -> Open Cropper
    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, bucket: 'logos' | 'banners') => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setActiveBucket(bucket);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || '');
                setCropModalOpen(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // 2. Save Cropped Image -> Upload
    const handleCropSave = async () => {
        if (!imageSrc || !croppedAreaPixels || !activeBucket) return;
        setUploading(true);

        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedImageBlob) throw new Error("Falha ao recortar imagem");

            if (!settings.organization_id) throw new Error("ID da organização não encontrado.");

            const fileExt = 'jpeg';
            const fileName = `${settings.organization_id}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;
            const file = new File([croppedImageBlob], fileName, { type: "image/jpeg" });

            // Upload
            const { error: uploadError } = await supabase.storage
                .from('organization-assets')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get URL
            const { data: { publicUrl } } = supabase.storage
                .from('organization-assets')
                .getPublicUrl(filePath);

            // Update Database
            const { error: dbError } = await supabase.from('organizations').update({
                [activeBucket === 'logos' ? 'logo_url' : 'banner_url']: publicUrl
            }).eq('id', settings.organization_id);

            if (dbError) throw dbError;

            toast.success('Imagem atualizada com sucesso!');
            await refreshOrganization();
            setCropModalOpen(false);
            setImageSrc(null);

        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error(`Erro: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const logoUrl = organization?.logoUrl;
    const bannerUrl = organization?.bannerUrl;


    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor Form */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="Identidade Visual" />
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-1">Nome da Barbearia</label>
                                <input
                                    {...register('establishment_name')}
                                    className="w-full bg-background border border-border rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="Ex: BarberHost"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-textMuted mb-1">Cor Primária</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            {...register('primary_color')}
                                            className="h-10 w-full rounded cursor-pointer bg-transparent"
                                        />
                                        <span className="text-xs font-mono text-textMuted">{previewPrimary}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-textMuted mb-1">Cor Secundária</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            {...register('secondary_color')}
                                            className="h-10 w-full rounded cursor-pointer bg-transparent"
                                        />
                                        <span className="text-xs font-mono text-textMuted">{previewSecondary}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-textMuted mb-2 flex justify-between">
                                        <span>Opacidade do Banner</span>
                                        <span className="text-primary font-mono">{previewOpacity}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        {...register('banner_opacity', { valueAsNumber: true })}
                                        min="0"
                                        max="100"
                                        className="w-full accent-primary bg-background"
                                    />
                                    <p className="text-[10px] text-textMuted mt-1 italic">* Controla a visibilidade do banner de fundo na página principal.</p>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <RefreshCw className="mr-2" size={16} />}
                                        Salvar Alterações
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Card>

                    <Card>
                        <CardHeader title="Imagens" />
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-2">Logo</label>
                                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer relative group">
                                    <Upload className="mx-auto text-textMuted mb-2 group-hover:text-primary transition-colors" />
                                    <span className="text-sm text-textMuted">Clique para enviar logo</span>
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => onFileSelect(e, 'logos')}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-2">Banner de Fundo</label>
                                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer relative group">
                                    <ImageIcon className="mx-auto text-textMuted mb-2 group-hover:text-primary transition-colors" />
                                    <span className="text-sm text-textMuted">Clique para enviar banner</span>
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => onFileSelect(e, 'banners')}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Live Preview */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-display font-bold text-zinc-100 tracking-tight">Cenário Digital</h3>
                            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Visualização em Tempo Real</p>
                        </div>
                        <div className="flex p-1 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl">
                            <button
                                type="button"
                                onClick={() => setPreviewMode('mobile')}
                                className={`group relative p-3 rounded-xl transition-all duration-300 ${previewMode === 'mobile' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
                                title="Visualização Mobile"
                            >
                                {previewMode === 'mobile' && (
                                    <div className="absolute inset-0 bg-primary/10 rounded-xl animate-in fade-in duration-300" />
                                )}
                                <Smartphone size={20} strokeWidth={1.5} className="relative z-10" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewMode('desktop')}
                                className={`group relative p-3 rounded-xl transition-all duration-300 ${previewMode === 'desktop' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
                                title="Visualização Desktop"
                            >
                                {previewMode === 'desktop' && (
                                    <div className="absolute inset-0 bg-primary/10 rounded-xl animate-in fade-in duration-300" />
                                )}
                                <Monitor size={20} strokeWidth={1.5} className="relative z-10" />
                            </button>
                        </div>
                    </div>

                    {/* The Mirror Container with Device Mockups */}
                    <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[750px] rounded-[2.5rem] bg-zinc-950/50 flex flex-col items-center justify-center p-8 overflow-hidden shadow-2xl border border-white/5 backdrop-blur-xl">
                        {/* Glassmorphism Atmosphere */}
                        <div 
                            className="absolute inset-0 z-0 opacity-60" 
                            style={{ background: `radial-gradient(circle at 50% 50%, ${previewPrimary}1F, transparent 70%)` }}
                        />
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                            {previewMode === 'mobile' ? (
                                /* iPhone Modern Mockup (Ultra-Precision) */
                                <div className="relative w-[300px] h-[610px] bg-zinc-900 rounded-[3.5rem] p-[7px] shadow-[0_0_0_1.5px_rgba(255,255,255,0.1),0_30px_60px_-12px_rgba(0,0,0,0.8),inset_0_0_2px_1px_rgba(255,255,255,0.05)] ring-1 ring-zinc-800 animate-in fade-in zoom-in duration-700">
                                    {/* Glossy Bezel Effect */}
                                    <div className="absolute inset-0 rounded-[3.5rem] bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                                    
                                    <div className="w-full h-full bg-black rounded-[3rem] relative overflow-hidden flex flex-col shadow-inner">
                                        {/* Dynamic Island */}
                                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#0a0a0a] rounded-full z-50 flex items-center justify-center gap-1.5 border border-white/5 shadow-2xl">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800/50" />
                                            <div className="w-8 h-1 bg-zinc-800/30 rounded-full" />
                                        </div>

                                        {/* App Content with Masking */}
                                        <div className="flex-1 overflow-y-auto no-scrollbar pt-12 pb-6 origin-top transform scale-[0.9] transition-all duration-500">
                                            <MirrorContent 
                                                primary={previewPrimary} 
                                                name={previewName} 
                                                logo={logoUrl} 
                                                banner={bannerUrl} 
                                                opacity={previewOpacity} 
                                            />
                                        </div>

                                        {/* Home Indicator */}
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full z-50" />
                                    </div>
                                    
                                    {/* Physical Buttons (Subtle) */}
                                    <div className="absolute -left-[2px] top-28 w-[3px] h-8 bg-zinc-700 rounded-l-sm" />
                                    <div className="absolute -left-[2px] top-40 w-[3px] h-12 bg-zinc-700 rounded-l-sm" />
                                    <div className="absolute -right-[2px] top-32 w-[3px] h-16 bg-zinc-700 rounded-r-sm" />
                                </div>
                            ) : (
                                /* MacBook Sleek Mockup (High Fidelity) */
                                <div className="relative w-full max-w-[680px] aspect-[16/10] bg-zinc-900 rounded-2xl p-[6px] shadow-[0_0_0_1.5px_rgba(255,255,255,0.1),0_40px_80px_-15px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    {/* Metal Frame Gradient */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-zinc-700/20 via-zinc-800/10 to-zinc-900/40 pointer-events-none" />
                                    
                                    <div className="w-full h-full bg-black rounded-lg relative overflow-hidden flex flex-col border border-white/5">
                                        {/* MacBook Screen Header / Camera */}
                                        <div className="h-7 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 flex items-center px-4 shrink-0 z-50">
                                            <div className="flex gap-1.5 w-16">
                                                <div className="w-2 h-2 rounded-full bg-[#FF5F56]/80 shadow-sm" />
                                                <div className="w-2 h-2 rounded-full bg-[#FFBD2E]/80 shadow-sm" />
                                                <div className="w-2 h-2 rounded-full bg-[#27C93F]/80 shadow-sm" />
                                            </div>
                                            <div className="flex-1 flex justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 shadow-[inset_0_0_2px_rgba(255,255,255,0.1)] border border-white/5" />
                                            </div>
                                            <div className="w-16 flex justify-end">
                                                <div className="bg-white/5 px-2 py-0.5 rounded text-[8px] text-zinc-500 font-mono">100%</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 bg-black relative overflow-hidden flex flex-col">
                                            {/* Browser Address Bar */}
                                            <div className="px-10 py-2">
                                                <div className="bg-white/5 rounded-lg h-6 flex items-center border border-white/5 px-3 gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-zinc-700" />
                                                    <span className="text-[9px] text-zinc-500 font-medium tracking-tight truncate">
                                                        barberhost.com.br/{organization?.slug}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto no-scrollbar origin-top transform scale-[0.98] transition-all duration-700">
                                                <MirrorContent 
                                                    primary={previewPrimary} 
                                                    name={previewName} 
                                                    logo={logoUrl} 
                                                    banner={bannerUrl} 
                                                    opacity={previewOpacity} 
                                                    isDesktop 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Glossy Screen Overlay */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Crop Modal */}
            {cropModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl backdrop-blur-xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Ajustar Imagem</h3>
                            <button onClick={() => setCropModalOpen(false)} className="text-zinc-500 hover:text-white p-2">✕</button>
                        </div>

                        <div className="relative w-full h-64 bg-black rounded-2xl overflow-hidden ring-1 ring-white/10">
                            {imageSrc && (
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={activeBucket === 'logos' ? 1 : 16 / 9}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Zoom</label>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full accent-primary bg-zinc-800 h-1.5 rounded-full appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setCropModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCropSave} disabled={uploading}>
                                {uploading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                Salvar Recorte
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


interface MirrorContentProps {
    primary: string;
    name: string;
    logo?: string;
    banner?: string;
    opacity: number;
    isDesktop?: boolean;
}

const MirrorContent: React.FC<MirrorContentProps> = ({ primary, name, logo, banner, opacity, isDesktop }) => (
    <div className={`w-full flex flex-col items-center transition-all duration-700 ${isDesktop ? 'p-12' : 'p-6'}`}>
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {banner ? (
                <img 
                    src={banner} 
                    alt="Banner" 
                    className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                    style={{ opacity: opacity / 100 }}
                />
            ) : (
                <div className="w-full h-full bg-zinc-900 transition-colors duration-700" />
            )}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] transition-all duration-700" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
            {/* Establishment Header */}
            <div className="text-center mb-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-[6px] border-zinc-900/50 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] bg-zinc-900 transition-all duration-500 hover:scale-105">
                    {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-display font-bold" style={{ color: primary, transition: 'color 0.5s ease' }}>
                            {name?.charAt(0) || 'B'}
                        </div>
                    )}
                </div>
                <h1 className="text-3xl font-display font-bold text-white tracking-[0.25em] mb-2 uppercase transition-all duration-500">
                    {name || 'Sua Barbearia'}
                </h1>
                <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 font-medium opacity-60 transition-opacity hover:opacity-100">
                    <MapPin size={12} style={{ color: primary, transition: 'color 0.5s ease' }} />
                    <p className="tracking-wide">Rua Exemplo, 123 - Centro</p>
                </div>
            </div>

            {/* Main Interaction Card */}
            <div className="w-full bg-zinc-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 text-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] mb-10 ring-1 ring-white/5 transition-all duration-500 hover:bg-zinc-950/50">
                <h2 className="text-2xl font-display text-white mb-6 font-medium tracking-tight">Pronto para o seu melhor visual?</h2>
                <button 
                    className="w-full py-5 rounded-2xl font-bold text-black text-sm shadow-2xl transition-all duration-300 hover:brightness-110 active:scale-[0.98] animate-[pulse_4s_infinite_ease-in-out] tracking-widest uppercase"
                    style={{ backgroundColor: primary, transition: 'background-color 0.5s ease' }}
                >
                    Agendar Agora
                </button>

                {/* Amenities Grid Mirror */}
                <div className="w-full mt-10 pt-8 border-t border-white/5">
                    <div className="grid grid-cols-3 gap-3">
                        {[Wifi, GlassWater, Snowflake].map((Icon, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 transition-all duration-300 hover:bg-white/[0.08] group">
                                <Icon size={16} className="text-white/40 group-hover:text-white/70 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const MenuIcon = () => (
    <Menu className="text-white" />
);
