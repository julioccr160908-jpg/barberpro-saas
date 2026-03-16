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
    ChevronLeft 
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
                    <div className="flex gap-2 bg-surface p-1 rounded-lg border border-border">
                        <button
                            type="button"
                            onClick={() => setPreviewMode('mobile')}
                            className={`p-2 rounded transition-all ${previewMode === 'mobile' ? 'bg-primary text-black shadow-lg' : 'text-textMuted hover:text-white'}`}
                        >
                            <Smartphone size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreviewMode('desktop')}
                            className={`p-2 rounded transition-all ${previewMode === 'desktop' ? 'bg-primary text-black shadow-lg' : 'text-textMuted hover:text-white'}`}
                        >
                            <Monitor size={18} />
                        </button>
                    </div>
                </div>

                {/* The Mirror Container */}
                <div className="relative w-full rounded-2xl bg-[#0A0A0A] border border-white/5 shadow-2xl overflow-hidden flex flex-col h-[700px] no-scrollbar">
                    {/* Top Bars (Simulation) */}
                    {previewMode === 'desktop' ? (
                        <div className="h-10 flex items-center px-4 gap-1.5 bg-zinc-900 border-b border-white/5 shrink-0 z-50">
                            <div className="flex gap-1.5 mr-4">
                                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                            </div>
                            <div className="flex-1 bg-black/40 rounded-lg h-7 flex items-center px-4 border border-white/5">
                                <span className="text-[11px] text-zinc-500 font-mono">barberhost.com.br/{organization?.slug}</span>
                            </div>
                            <div className="ml-4 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/50">
                                <ChevronLeft size={10} className="inline mr-1" /> Voltar ao Painel
                            </div>
                        </div>
                    ) : (
                        <div className="h-8 flex justify-between items-center px-6 bg-black shrink-0 z-50">
                            <span className="text-[10px] font-bold text-white">9:41</span>
                            <div className="w-20 h-4 bg-zinc-900 rounded-b-xl" />
                            <div className="flex gap-1.5 items-center">
                                <div className="w-4 h-2 rounded-[2px] border border-white/30" />
                                <div className="w-2 h-2 bg-white/30 rounded-full" />
                            </div>
                        </div>
                    )}

                    {/* App Content Container (Mirroring BookingFlow exactly) */}
                    <div 
                        className={`flex-1 relative overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col items-center p-4 sm:p-8 ${previewMode === 'mobile' ? 'max-w-[400px] mx-auto w-full' : 'w-full'}`}
                        style={{
                            '--primary': previewPrimary,
                            '--secondary': previewSecondary,
                            backgroundColor: '#0A0A0A'
                        } as React.CSSProperties}
                    >
                        {/* Background Layer (Matches BookingFlow) */}
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                            {bannerUrl ? (
                                <img 
                                    src={bannerUrl} 
                                    alt="Banner" 
                                    className="w-full h-full object-cover transition-opacity duration-700"
                                    style={{ opacity: previewOpacity / 100 }}
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-900" />
                            )}
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        </div>

                        {/* Content (Z-Index 10) */}
                        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
                            {/* Establishment Header */}
                            <div className="text-center mb-12">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl bg-zinc-900">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold font-display" style={{ color: previewPrimary }}>
                                            {previewName?.charAt(0) || 'B'}
                                        </div>
                                    )}
                                </div>
                                <h1 className="text-4xl font-display font-bold text-white tracking-[0.2em] mb-2 uppercase">
                                    {previewName || 'Sua Barbearia'}
                                </h1>
                                <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 opacity-80">
                                    <MapPin size={14} style={{ color: previewPrimary }} />
                                    <p>Rua Exemplo, 123 - Centro</p>
                                </div>
                            </div>

                            {/* Booking Steps Indicator (Small simulation) */}
                            <div className="flex items-center justify-center mb-8 gap-2 w-full max-w-sm px-4">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <div
                                        key={s}
                                        style={{ backgroundColor: s === 1 ? previewPrimary : '#1A1A1A' }}
                                        className="h-1 flex-1 rounded-full opacity-50"
                                    />
                                ))}
                            </div>

                            {/* Main Interaction Card (Mirroring Showcase Step) */}
                            <div className="w-full bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 sm:p-12 text-center shadow-2xl mb-12 ring-1 ring-white/5">
                                <h2 className="text-3xl font-display text-white mb-4">Pronto para o seu melhor visual?</h2>
                                <p className="text-zinc-400 mb-10 max-w-sm mx-auto text-lg leading-relaxed">
                                    Agende agora seu horário com nossos profissionais qualificados.
                                </p>
                                <button 
                                    className="w-full py-6 rounded-2xl font-bold text-black text-xl shadow-2xl transition-all hover:brightness-110 active:scale-[0.98]"
                                    style={{ backgroundColor: previewPrimary }}
                                >
                                    Agendar Agora
                                </button>

                                {/* Amenities Grid Mirror */}
                                <div className="w-full mt-12 pt-10 border-t border-white/5">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-8">Comodidades</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Wi-Fi Grátis', icon: Wifi },
                                            { label: 'Água / Bebidas', icon: GlassWater },
                                            { label: 'Ar Condicionado', icon: Snowflake },
                                            { label: 'Videogame', icon: Gamepad2 },
                                            { label: 'Sinuca / Jogos', icon: Dices },
                                            { label: 'Aceita Pix', icon: QrCode },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <item.icon size={20} className="text-white/70" />
                                                <span className="text-[10px] font-bold text-zinc-400">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Portfolio Simulation */}
                                <div className="w-full mt-12 pt-10 border-t border-white/5 text-left">
                                     <h3 className="text-sm font-bold text-white uppercase tracking-[0.1em] mb-6 flex items-center gap-2">
                                        <Camera size={18} style={{ color: previewPrimary }} /> Nosso Portfolio
                                     </h3>
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="aspect-square rounded-3xl bg-zinc-800/50 border border-white/5 overflow-hidden animate-pulse" />
                                        <div className="aspect-square rounded-3xl bg-zinc-800/50 border border-white/5 overflow-hidden animate-pulse" />
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Crop Modal */}
            {cropModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Ajustar Imagem</h3>
                            <button onClick={() => setCropModalOpen(false)} className="text-textMuted hover:text-white">✕</button>
                        </div>

                        <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
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
                            <label className="text-sm text-textMuted">Zoom</label>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full accent-primary"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setCropModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCropSave} disabled={uploading}>
                                {uploading ? <Loader2 className="animate-spin mr-2" /> : null}
                                Salvar Recorte
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MenuIcon = () => (
    <Menu className="text-white" />
);
