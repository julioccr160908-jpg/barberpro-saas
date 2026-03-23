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
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Pré-visualização</h3>
                        <div className="flex gap-2 bg-zinc-900 border border-white/10 p-1 rounded-xl backdrop-blur-md">
                            <button
                                type="button"
                                onClick={() => setPreviewMode('mobile')}
                                className={`p-2.5 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${previewMode === 'mobile' ? 'bg-primary text-black shadow-lg scale-105' : 'text-zinc-500 hover:text-white'}`}
                            >
                                <Smartphone size={16} />
                                <span className={previewMode === 'mobile' ? 'block' : 'hidden'}>Mobile</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewMode('desktop')}
                                className={`p-2.5 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${previewMode === 'desktop' ? 'bg-primary text-black shadow-lg scale-105' : 'text-zinc-500 hover:text-white'}`}
                            >
                                <Monitor size={16} />
                                <span className={previewMode === 'desktop' ? 'block' : 'hidden'}>Desktop</span>
                            </button>
                        </div>
                    </div>

                    {/* The Mirror Container with Device Mockups */}
                    <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[750px] rounded-3xl bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl border border-white/5">
                        {/* Glassmorphism Background Effect */}
                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                            {previewMode === 'mobile' ? (
                                /* iPhone Mockup */
                                <div className="relative w-[300px] h-[600px] bg-zinc-900 rounded-[3rem] border-[8px] border-zinc-800 shadow-[0_0_0_2px_rgba(255,255,255,0.05),0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-500 ring-1 ring-white/10">
                                    {/* iPhone Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-50 flex items-center justify-center gap-2">
                                        <div className="w-10 h-1 bg-black/20 rounded-full" />
                                        <div className="w-2 h-2 bg-black/20 rounded-full" />
                                    </div>
                                    {/* Side Buttons Simulation */}
                                    <div className="absolute left-[-10px] top-24 w-1 h-12 bg-zinc-700 rounded-r-lg" />
                                    <div className="absolute right-[-10px] top-32 w-1 h-16 bg-zinc-700 rounded-l-lg" />
                                    
                                    <div className="flex-1 bg-black relative overflow-hidden flex flex-col">
                                        {/* App Content with Scale */}
                                        <div className="flex-1 overflow-y-auto no-scrollbar pt-6 origin-top transform scale-[0.85]">
                                            <MirrorContent 
                                                primary={previewPrimary} 
                                                name={previewName} 
                                                logo={logoUrl} 
                                                banner={bannerUrl} 
                                                opacity={previewOpacity} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* MacBook Mockup */
                                <div className="relative w-full max-w-[650px] aspect-[16/10] bg-zinc-900 rounded-2xl border-[4px] border-zinc-800 shadow-[0_0_0_2px_rgba(255,255,255,0.05),0_30px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ring-1 ring-white/10">
                                    {/* MacBook Screen Header */}
                                    <div className="h-6 bg-zinc-800 border-b border-white/5 flex items-center px-4 gap-1.5 shrink-0 z-50">
                                        <div className="flex gap-1.5 mr-4">
                                            <div className="w-2 h-2 rounded-full bg-[#FF5F56] opacity-70" />
                                            <div className="w-2 h-2 rounded-full bg-[#FFBD2E] opacity-70" />
                                            <div className="w-2 h-2 rounded-full bg-[#27C93F] opacity-70" />
                                        </div>
                                        <div className="flex-1 bg-black/40 rounded h-4 flex items-center px-3 border border-white/5 mx-8">
                                            <span className="text-[8px] text-zinc-500 font-mono italic">barberhost.com.br/{organization?.slug}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-black relative overflow-hidden flex flex-col">
                                        <div className="flex-1 overflow-y-auto no-scrollbar origin-top transform scale-100">
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
    <div className={`w-full flex flex-col items-center ${isDesktop ? 'p-8' : 'p-4'}`}>
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {banner ? (
                <img 
                    src={banner} 
                    alt="Banner" 
                    className="w-full h-full object-cover transition-opacity duration-700"
                    style={{ opacity: opacity / 100 }}
                />
            ) : (
                <div className="w-full h-full bg-zinc-900" />
            )}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full flex flex-col items-center">
            {/* Establishment Header */}
            <div className="text-center mb-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl bg-zinc-900">
                    {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold font-display" style={{ color: primary }}>
                            {name?.charAt(0) || 'B'}
                        </div>
                    )}
                </div>
                <h1 className="text-2xl font-display font-bold text-white tracking-[0.2em] mb-1 uppercase">
                    {name || 'Sua Barbearia'}
                </h1>
                <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 opacity-80">
                    <MapPin size={10} style={{ color: primary }} />
                    <p>Rua Exemplo, 123 - Centro</p>
                </div>
            </div>

            {/* Main Interaction Card */}
            <div className="w-full bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 text-center shadow-2xl mb-8 ring-1 ring-white/5">
                <h2 className="text-xl font-display text-white mb-4">Pronto para o seu melhor visual?</h2>
                <button 
                    className="w-full py-4 rounded-xl font-bold text-black text-sm shadow-2xl transition-all hover:brightness-110 active:scale-[0.98] animate-[pulse_3s_infinite_ease-in-out]"
                    style={{ backgroundColor: primary }}
                >
                    Agendar Agora
                </button>

                {/* Amenities Grid Mirror */}
                <div className="w-full mt-8 pt-6 border-t border-white/5">
                    <div className="grid grid-cols-3 gap-2">
                        {[Wifi, GlassWater, Snowflake].map((Icon, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                                <Icon size={14} className="text-white/70" />
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
