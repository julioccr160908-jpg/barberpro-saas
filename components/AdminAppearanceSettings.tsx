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

                <div className={`border-2 border-zinc-800 rounded-2xl overflow-hidden bg-black mx-auto shadow-2xl relative transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-[360px] aspect-[9/16]' : 'w-full aspect-video max-h-[600px]'}`}>
                    {/* Desktop Browser Bar */}
                    {previewMode === 'desktop' && (
                        <div className="h-8 bg-zinc-800 flex items-center px-4 gap-1.5 border-b border-black">
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
                        <div className="h-6 bg-black flex justify-between px-6 items-end pb-1 text-[10px] font-bold text-white relative z-50">
                            <span>9:41</span>
                            <div className="flex gap-1 items-center">
                                <div className="w-3 h-1.5 rounded-sm border border-white/30" />
                                <div className="w-2 h-2 bg-white/30 rounded-full" />
                            </div>
                        </div>
                    )}

                    {/* App Content Container */}
                    <div
                        className="h-full flex flex-col font-sans overflow-hidden relative"
                        style={{
                            '--primary': previewPrimary,
                            '--secondary': previewSecondary
                        } as React.CSSProperties}
                    >
                        {/* Realistic Background (Matches BookingFlow) */}
                        <div className="absolute inset-0 z-0 overflow-hidden">
                            {bannerUrl ? (
                                <img 
                                    src={bannerUrl} 
                                    className="w-full h-full object-cover transition-opacity duration-500" 
                                    alt="Banner" 
                                    style={{ opacity: previewOpacity / 100 }}
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-900" />
                            )}
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="relative z-10 flex-col flex overflow-y-auto no-scrollbar h-full">
                            {/* Header (Simplified to match reality) */}
                            <div className="px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold overflow-hidden bg-zinc-900 border border-white/10 shadow-lg">
                                        {logoUrl ? (
                                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <span style={{ color: previewPrimary }} className="text-xl">B</span>
                                        )}
                                    </div>
                                    <span className="text-white font-bold text-lg tracking-tight">{previewName || 'BarberHost'}</span>
                                </div>
                                <div className="w-10 h-10 flex items-center justify-center text-white/70">
                                    <Menu size={24} />
                                </div>
                            </div>

                            {/* Main Interaction Area (Simplified representation of BookingFlow) */}
                            <div className="px-6 py-4 space-y-6 max-w-2xl mx-auto w-full">
                                <div className="bg-zinc-900/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
                                    <h4 className="text-white font-bold text-xl mb-2">Corte & Estilo</h4>
                                    <p className="text-zinc-400 text-sm mb-6">
                                        Experiência única com os melhores profissionais da região. Agende seu horário agora mesmo.
                                    </p>
                                    <button
                                        className="w-full py-4 rounded-2xl font-bold text-black text-base shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        style={{ backgroundColor: previewPrimary }}
                                    >
                                        Agendar Agora
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest px-1">Serviços Populares</h5>
                                    <div className="grid gap-3">
                                        {[
                                            { name: 'Corte Degradê', price: '50', time: '45 min' },
                                            { name: 'Barba Completa', price: '40', time: '30 min' }
                                        ].map((s, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-zinc-900/40 border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">✂️</div>
                                                    <div>
                                                        <p className="text-white font-semibold text-sm">{s.name}</p>
                                                        <p className="text-zinc-500 text-xs">{s.time}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white font-bold text-sm">R$ {s.price}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Nav (Mobile Only) */}
                        {previewMode === 'mobile' && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl p-4 flex justify-around border-t border-white/5 z-40">
                                <div className="flex flex-col items-center gap-1" style={{ color: previewPrimary }}>
                                    <div className="w-1.5 h-1.5 rounded-full mb-0.5" style={{ backgroundColor: previewPrimary }} />
                                    <span className="text-[9px] font-bold uppercase tracking-tighter">Início</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 text-zinc-600">
                                    <div className="w-4 h-4 rounded-md bg-zinc-800" />
                                    <span className="text-[9px] font-bold uppercase tracking-tighter">Agenda</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 text-zinc-600">
                                    <div className="w-4 h-4 rounded-md bg-zinc-800" />
                                    <span className="text-[9px] font-bold uppercase tracking-tighter">Conta</span>
                                </div>
                            </div>
                        )}
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
