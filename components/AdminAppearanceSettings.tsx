import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from './ui/Card';
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
            establishment_name: settings.establishment_name || 'Minha Barbearia'
        }
    });

    const previewPrimary = watch('primary_color');
    const previewSecondary = watch('secondary_color');
    const previewName = watch('establishment_name');

    useEffect(() => {
        if (settings) {
            reset({
                primary_color: settings.primary_color || '#D4AF37',
                secondary_color: settings.secondary_color || '#1A1A1A',
                establishment_name: settings.establishment_name || settings.establishment_name || ''
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
                establishment_name: data.establishment_name
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

    const logoUrl = organization?.logoUrl || settings?.logo_url;
    const bannerUrl = organization?.bannerUrl || settings?.banner_url;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor Form */}
            <div className="space-y-6">
                <Card title="Identidade Visual">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-textMuted mb-1">Nome da Barbearia</label>
                            <input
                                {...register('establishment_name')}
                                className="w-full bg-background border border-border rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="Ex: Barber Pro"
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

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <RefreshCw className="mr-2" size={16} />}
                                Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </Card>

                <Card title="Imagens">
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

                <div className={`border border-border rounded-3xl overflow-hidden bg-black mx-auto shadow-2xl relative transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-sm h-[600px]' : 'w-full h-[600px]'
                    }`}>

                    {/* Device Header (Only for Mobile) */}
                    {previewMode === 'mobile' && (
                        <div className="h-6 bg-black flex justify-between px-4 items-center text-[10px] text-white">
                            <span>9:41</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                        </div>
                    )}

                    {/* App Content */}
                    <div className="bg-zinc-900 h-full flex flex-col font-sans overflow-y-auto">
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold overflow-hidden bg-zinc-800 border border-white/10">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <span style={{ color: previewPrimary }}>B</span>
                                    )}
                                </div>
                                <span className="text-white font-bold text-lg">{previewName || 'BarberPro'}</span>
                            </div>
                            <MenuIcon />
                        </div>

                        {/* Hero Banner */}
                        <div className="h-48 bg-gray-800 relative overflow-hidden shrink-0">
                            {bannerUrl ? (
                                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 space-y-4 -mt-6 relative z-0">
                            {/* Booking Card */}
                            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 shadow-lg" style={{ borderColor: `${previewPrimary}40` }}>
                                <h4 className="text-white font-bold mb-2">Agendar Horário</h4>
                                <p className="text-gray-400 text-xs mb-4">Escolha o serviço e o profissional de sua preferência.</p>
                                <button
                                    className="w-full py-3 rounded-lg font-bold text-black text-sm shadow-lg hover:brightness-110 transition-all"
                                    style={{ backgroundColor: previewPrimary }}
                                >
                                    Agendar Agora
                                </button>
                            </div>

                            {/* My Appointments */}
                            <div className="bg-[#1A1A1A] p-4 rounded-xl flex items-center gap-3 border border-white/5">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 text-white">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <h5 className="text-white text-sm font-medium">Meus Agendamentos</h5>
                                    <p className="text-gray-500 text-xs">Visualize seus cortes futuros</p>
                                </div>
                            </div>

                            {/* Dummy Content to fill space */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#1A1A1A] aspect-square rounded-xl animate-pulse bg-opacity-50"></div>
                                <div className="bg-[#1A1A1A] aspect-square rounded-xl animate-pulse bg-opacity-50"></div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Nav (Mobile Only) */}
                    {previewMode === 'mobile' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black p-4 flex justify-around border-t border-white/10 z-20">
                            <div className="flex flex-col items-center gap-1" style={{ color: previewPrimary }}>
                                <div className="w-6 h-6 rounded bg-current opacity-20"></div>
                                <span className="text-[10px]">Início</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-gray-500">
                                <div className="w-6 h-6 rounded bg-gray-700"></div>
                                <span className="text-[10px]">Perfil</span>
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
