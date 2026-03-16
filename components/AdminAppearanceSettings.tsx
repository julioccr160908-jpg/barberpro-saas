import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { useSettings } from '../contexts/SettingsContext';
import { toast } from 'sonner';
import { Loader2, Upload, ImageIcon, RefreshCw, Clock, Menu, Maximize2, Smartphone, Monitor } from 'lucide-react';
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
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Pré-visualização</h3>
                    <div className="flex gap-2 bg-surface p-1 rounded-lg border border-border">
                        <button
                            onClick={() => setPreviewMode('mobile')}
                            className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-primary text-black' : 'text-textMuted hover:text-white'}`}
                        >
                            <Smartphone size={18} />
                        </button>
                        <button
                            onClick={() => setPreviewMode('desktop')}
                            className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-primary text-black' : 'text-textMuted hover:text-white'}`}
                        >
                            <Monitor size={18} />
                        </button>
                    </div>
                </div>

                <div className={`border-4 border-zinc-800 rounded-[3rem] overflow-hidden bg-[#0A0A0A] mx-auto shadow-2xl relative transition-all duration-500 ring-8 ring-zinc-900/50 ${previewMode === 'mobile' ? 'max-w-[375px] h-[750px] scale-[0.8] origin-top' : 'w-full h-[600px] rounded-xl border-t-[32px]'
                    }`}>

                    {/* Desktop Browser Bar */}
                    {previewMode === 'desktop' && (
                        <div className="absolute top-[-32px] left-0 right-0 h-8 bg-zinc-800 flex items-center px-4 gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                            <div className="ml-4 flex-1 bg-black/20 rounded-md h-5 flex items-center px-3">
                                <span className="text-[10px] text-zinc-500 truncate">barberhost.com.br/{organization?.slug || 'sua-barbearia'}</span>
                            </div>
                        </div>
                    )}

                    {/* Device Status Bar (Mobile Only) */}
                    {previewMode === 'mobile' && (
                        <div className="h-10 bg-black flex justify-between px-8 items-end pb-1 text-[11px] font-bold text-white relative z-50">
                            <span>9:41</span>
                            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-32 h-6 bg-black rounded-b-2xl flex items-center justify-center">
                                <div className="w-12 h-1 bg-zinc-800 rounded-full" />
                            </div>
                            <div className="flex gap-1.5 items-center">
                                <div className="w-4 h-2 rounded-sm border border-white/30" />
                                <div className="w-3 h-3 bg-white/30 rounded-full" />
                            </div>
                        </div>
                    )}

                    {/* App Content */}
                    <div
                        className={`bg-black h-full flex flex-col font-sans overflow-y-auto no-scrollbar transition-all duration-300 pb-20 ${previewMode === 'desktop' ? 'w-[1440px] origin-top-left scale-[0.7] border-r border-white/5 shadow-2xl overflow-x-hidden' : ''}`}
                        style={{
                            '--primary': previewPrimary,
                            '--secondary': previewSecondary,
                            ...(previewMode === 'desktop' ? { minWidth: '1440px', height: '142.85%' } : {})
                        } as React.CSSProperties}
                    >
                        {/* Glassmorphism Header */}
                        <div className={`p-4 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 left-0 right-0 z-40 ${previewMode === 'desktop' ? 'px-12 py-6' : ''}`}>
                            <div className="flex items-center gap-2.5">
                                <div className={`flex items-center justify-center text-black font-bold overflow-hidden bg-zinc-900 border border-white/10 shadow-lg ${previewMode === 'desktop' ? 'w-14 h-14 rounded-2xl' : 'w-9 h-9 rounded-xl'}`}>
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <span style={{ color: previewPrimary }} className={previewMode === 'desktop' ? 'text-2xl' : 'text-lg'}>B</span>
                                    )}
                                </div>
                                <span className={`text-white font-display font-bold tracking-tight ${previewMode === 'desktop' ? 'text-2xl' : 'text-base'}`}>{previewName || 'BarberHost'}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                {previewMode === 'desktop' && (
                                    <div className="flex gap-8 text-white/50 text-sm font-medium mr-4">
                                        <span className="text-white">Início</span>
                                        <span>Serviços</span>
                                        <span>Sobre</span>
                                        <span>Contato</span>
                                    </div>
                                )}
                                <div className={`${previewMode === 'desktop' ? 'hidden' : 'w-8 h-8 flex items-center justify-center text-white/70'}`}>
                                    <Menu size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Hero Section */}
                        <div className="relative shrink-0">
                            <div className={`${previewMode === 'desktop' ? 'h-[500px]' : 'h-44'} relative overflow-hidden`}>
                                {bannerUrl ? (
                                    <img 
                                        src={bannerUrl} 
                                        alt="Banner" 
                                        className="w-full h-full object-cover transition-opacity duration-300" 
                                        style={{ opacity: previewOpacity / 100 }}
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-zinc-700">
                                        <ImageIcon size={previewMode === 'desktop' ? 80 : 40} className="opacity-20" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                                {previewMode === 'desktop' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                                        <h1 className="text-white text-6xl font-display font-black mb-4 tracking-tighter drop-shadow-2xl">
                                            ESTILO É <span style={{ color: previewPrimary }}>ATITUDE.</span>
                                        </h1>
                                        <p className="text-white/70 text-xl max-w-2xl">
                                            Onde a tradição encontra o moderno. Agende seu horário com os melhores profissionais.
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Stats/Badges */}
                            <div className={`absolute bottom-4 left-4 flex gap-2 ${previewMode === 'desktop' ? 'left-12 bottom-8' : ''}`}>
                                <div className={`${previewMode === 'desktop' ? 'text-sm px-4 py-2' : 'text-[10px] px-2 py-1'} bg-black/60 backdrop-blur-md rounded text-white flex items-center gap-1 border border-white/5`}>
                                    <Clock size={previewMode === 'desktop' ? 14 : 10} className="text-primary" /> Aberto agora
                                </div>
                            </div>
                        </div>

                        {/* Main Interaction Area */}
                        <div className={`p-4 space-y-5 -mt-6 relative z-10 ${previewMode === 'desktop' ? 'px-12 py-12 -mt-20 gap-12 block space-y-0 grid grid-cols-12 items-start' : ''}`}>
                            {/* Primary Action Card */}
                            <div 
                                className={`bg-zinc-900/90 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden relative ${previewMode === 'desktop' ? 'col-span-5 p-10 rounded-[2.5rem]' : 'p-5 rounded-2xl'}`}
                                style={{ borderColor: `${previewPrimary}30` }}
                            >
                                <div className={`absolute -right-4 -top-4 rounded-full blur-3xl opacity-20 ${previewMode === 'desktop' ? 'w-48 h-48' : 'w-20 h-20'}`} style={{ backgroundColor: previewPrimary }} />
                                
                                <h4 className={`text-white font-bold mb-1 ${previewMode === 'desktop' ? 'text-3xl mb-4' : 'text-base'}`}>Corte & Estilo</h4>
                                <p className={`text-zinc-400 leading-relaxed ${previewMode === 'desktop' ? 'text-base mb-10' : 'text-[10px] mb-4'}`}>
                                    {previewMode === 'desktop' 
                                        ? 'Proporcione a si mesmo o tratamento que você merece. Nossos especialistas estão prontos para transformar seu visual com técnicas modernas e produtos de alta qualidade.'
                                        : 'Experiência única com os melhores profissionais da região.'
                                    }
                                </p>
                                <button
                                    className={`font-bold text-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${previewMode === 'desktop' ? 'w-full py-5 rounded-2xl text-lg' : 'w-full py-2.5 rounded-xl text-[13px]'}`}
                                    style={{ backgroundColor: previewPrimary }}
                                >
                                    Agendar Agora <Maximize2 size={previewMode === 'desktop' ? 18 : 12} />
                                </button>
                            </div>

                            <div className={`${previewMode === 'desktop' ? 'col-span-1' : 'hidden'}`}></div>

                            <div className={`space-y-6 ${previewMode === 'desktop' ? 'col-span-6 mt-14' : ''}`}>
                                {/* Secondary Action */}
                                <div
                                    className={`rounded-2xl flex items-center gap-3 border border-white/5 transition-all hover:bg-white/[0.02] ${previewMode === 'desktop' ? 'p-6 rounded-3xl' : 'p-4'}`}
                                    style={{ backgroundColor: `${previewSecondary}80` }}
                                >
                                    <div className={`rounded-full flex items-center justify-center bg-white/5 text-white/80 border border-white/10 ${previewMode === 'desktop' ? 'w-14 h-14' : 'w-9 h-9'}`}>
                                        <Clock size={previewMode === 'desktop' ? 24 : 16} />
                                    </div>
                                    <div>
                                        <h5 className={`text-white font-semibold ${previewMode === 'desktop' ? 'text-xl' : 'text-xs'}`}>Minha Agenda</h5>
                                        <p className={`text-zinc-500 ${previewMode === 'desktop' ? 'text-sm' : 'text-[10px]'}`}>Gerencie seus cortes marcados</p>
                                    </div>
                                    <div className="ml-auto text-zinc-600">
                                        <Maximize2 size={previewMode === 'desktop' ? 18 : 12} />
                                    </div>
                                </div>

                                {/* Mock Services Section */}
                                <div className="space-y-4">
                                    <h4 className={`font-bold text-zinc-500 uppercase tracking-widest pl-1 ${previewMode === 'desktop' ? 'text-sm' : 'text-[11px]'}`}>Serviços Populares</h4>
                                    <div className={`space-y-2 ${previewMode === 'desktop' ? 'grid grid-cols-2 gap-4 space-y-0' : ''}`}>
                                        {[
                                            { name: 'Corte Degradê', price: '50', icon: '✂️' },
                                            { name: 'Barba Completa', price: '40', icon: '🧔' }
                                        ].map((s, i) => (
                                            <div key={i} className={`flex justify-between items-center bg-zinc-900/50 border border-white/5 ${previewMode === 'desktop' ? 'p-5 rounded-2xl' : 'p-3 rounded-xl'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`rounded-lg bg-zinc-800 flex items-center justify-center ${previewMode === 'desktop' ? 'w-12 h-12 text-xl' : 'w-8 h-8 text-sm'}`}>{s.icon}</div>
                                                    <span className={`text-zinc-300 font-medium ${previewMode === 'desktop' ? 'text-base' : 'text-sm'}`}>{s.name}</span>
                                                </div>
                                                <span className={`text-white font-bold ${previewMode === 'desktop' ? 'text-base' : 'text-sm'}`}>R$ {s.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Bottom Nav (Mobile Only) */}
                    {previewMode === 'mobile' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl p-4 flex justify-around border-t border-white/5 z-40 rounded-b-[2.8rem]">
                            <div className="flex flex-col items-center gap-1" style={{ color: previewPrimary }}>
                                <div className="w-1.5 h-1.5 rounded-full mb-0.5" style={{ backgroundColor: previewPrimary }} />
                                <span className="text-[9px] font-bold uppercase tracking-tighter">Início</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-zinc-600">
                                <div className="w-5 h-5 rounded-md bg-zinc-900" />
                                <span className="text-[9px] font-bold uppercase tracking-tighter">Clube</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-zinc-600">
                                <div className="w-5 h-5 rounded-md bg-zinc-900" />
                                <span className="text-[9px] font-bold uppercase tracking-tighter">Conta</span>
                            </div>
                        </div>
                    )}
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
