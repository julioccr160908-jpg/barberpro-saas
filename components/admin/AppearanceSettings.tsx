
import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Upload, Image as ImageIcon, Palette, Eye, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { db } from '../../services/database';

interface BrandingSettings {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    themeMode: 'dark' | 'light';
}

export const AppearanceSettings: React.FC = () => {
    const [settings, setSettings] = useState<BrandingSettings>({
        primaryColor: '#D4AF37',
        secondaryColor: '#1A1A1A',
        logoUrl: null,
        bannerUrl: null,
        themeMode: 'dark'
    });

    const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);

    // Load initial settings
    useEffect(() => {
        const load = async () => {
            const org = await db.organizations.get();
            if (org) {
                setSettings({
                    primaryColor: org.primary_color || '#D4AF37',
                    secondaryColor: org.secondary_color || '#1A1A1A',
                    logoUrl: org.logo_url || null,
                    bannerUrl: org.banner_url || null,
                    themeMode: (org.theme_mode as 'dark' | 'light') || 'dark'
                });
            }
        };
        load();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(type);

        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("No user");

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('organization-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('organization-assets')
                .getPublicUrl(filePath);

            setSettings(prev => ({
                ...prev,
                [type === 'logo' ? 'logoUrl' : 'bannerUrl']: publicUrl
            }));

        } catch (error) {
            console.error("Upload failed", error);
            alert("Erro ao fazer upload da imagem.");
        } finally {
            setUploading(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('organizations')
                .update({
                    primary_color: settings.primaryColor,
                    secondary_color: settings.secondaryColor,
                    logo_url: settings.logoUrl,
                    banner_url: settings.bannerUrl,
                    theme_mode: settings.themeMode
                })
                .eq('owner_id', (await supabase.auth.getUser()).data.user?.id);

            if (error) throw error;
            // Show success logic here (toast etc)
        } catch (error) {
            console.error("Save failed", error);
            alert("Erro ao salvar aparência.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Editor Column */}
            <div className="space-y-6">
                <Card className="p-6 bg-surface/50 backdrop-blur-sm border-white/5 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                            <Palette size={20} className="text-primary" />
                            Identidade Visual
                        </h3>
                        <p className="text-sm text-textMuted">Personalize as cores da sua página de agendamento.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-textMuted mb-2">Cor Principal</label>
                            <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-lg border border-white/20 overflow-hidden shadow-inner">
                                    <input
                                        type="color"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                        className="absolute -top-2 -left-2 w-20 h-20 cursor-pointer opacity-0"
                                    />
                                    <div className="w-full h-full" style={{ backgroundColor: settings.primaryColor }}></div>
                                </div>
                                <Input
                                    value={settings.primaryColor}
                                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                    className="uppercase font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-textMuted mb-2">Cor Secundária</label>
                            <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-lg border border-white/20 overflow-hidden shadow-inner">
                                    <input
                                        type="color"
                                        value={settings.secondaryColor}
                                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                        className="absolute -top-2 -left-2 w-20 h-20 cursor-pointer opacity-0"
                                    />
                                    <div className="w-full h-full" style={{ backgroundColor: settings.secondaryColor }}></div>
                                </div>
                                <Input
                                    value={settings.secondaryColor}
                                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                    className="uppercase font-mono"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-surface/50 backdrop-blur-sm border-white/5 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                            <ImageIcon size={20} className="text-primary" />
                            Imagens
                        </h3>
                        <p className="text-sm text-textMuted">Logo e imagem de capa do estabelecimento.</p>
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-textMuted">Logo do Estabelecimento</label>
                        <div className="flex items-start gap-4">
                            <div className={`
                                w-24 h-24 rounded-full border-2 border-dashed border-white/20 
                                flex items-center justify-center overflow-hidden bg-black/20
                                ${!settings.logoUrl ? 'p-4' : ''}
                            `}>
                                {settings.logoUrl ? (
                                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload size={24} className="text-textMuted" />
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="inline-flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                                    <span className="text-sm font-medium text-white">Carregar Nova Logo</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'logo')}
                                        disabled={uploading === 'logo'}
                                    />
                                </label>
                                <p className="text-xs text-textMuted mt-2">Recomendado: 250x250px (PNG Transparente)</p>
                                {uploading === 'logo' && <p className="text-xs text-primary mt-1 animate-pulse">Enviando...</p>}
                            </div>
                        </div>
                    </div>

                    {/* Banner Upload */}
                    <div className="space-y-2 pt-4 border-t border-white/5">
                        <label className="block text-sm font-medium text-textMuted">Imagem de Capa (Banner)</label>
                        <div className="relative w-full h-32 rounded-lg border-2 border-dashed border-white/20 overflow-hidden bg-black/20 group">
                            {settings.bannerUrl ? (
                                <img src={settings.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-textMuted">
                                    <ImageIcon size={32} className="mb-2" />
                                    <span className="text-sm">Nenhuma imagem selecionada</span>
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                <span className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium backdrop-blur-sm border border-white/20">
                                    Alterar Capa
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'banner')}
                                    disabled={uploading === 'banner'}
                                />
                            </label>
                        </div>
                        {uploading === 'banner' && <p className="text-xs text-primary mt-1 animate-pulse">Enviando...</p>}
                    </div>
                </Card>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline">Descartar</Button>
                    <Button onClick={handleSave} disabled={saving || !!uploading}>
                        {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Check className="mr-2" size={18} />}
                        Salvar Alterações
                    </Button>
                </div>
            </div>

            {/* Preview Column */}
            <div className="hidden lg:block space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Eye size={20} className="text-primary" />
                        Pré-visualização
                    </h3>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setPreviewMode('mobile')}
                            className={`px-3 py-1 rounded text-xs font-medium transition-all ${previewMode === 'mobile' ? 'bg-primary text-black shadow-lg' : 'text-textMuted hover:text-white'}`}
                        >
                            Mobile
                        </button>
                        <button
                            onClick={() => setPreviewMode('desktop')}
                            className={`px-3 py-1 rounded text-xs font-medium transition-all ${previewMode === 'desktop' ? 'bg-primary text-black shadow-lg' : 'text-textMuted hover:text-white'}`}
                        >
                            Desktop
                        </button>
                    </div>
                </div>

                {/* Preview Container Center */}
                <div className="flex justify-center">

                    {/* Mobile Preview Frame */}
                    {previewMode === 'mobile' ? (
                        <div className="w-[320px] h-[640px] border-[8px] border-zinc-800 rounded-[3rem] bg-black overflow-hidden relative shadow-2xl transition-all duration-500">
                            {/* Simulated Content */}
                            <div className="absolute inset-0 bg-background overflow-y-auto custom-scrollbar" style={{
                                backgroundColor: settings.themeMode === 'light' ? '#f4f4f5' : '#09090b',
                                color: settings.themeMode === 'light' ? '#18181b' : '#fafafa'
                            }}>

                                {/* Dynamic Banner */}
                                <div className="h-40 w-full relative">
                                    {settings.bannerUrl ? (
                                        <img src={settings.bannerUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black"></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                </div>

                                {/* Dynamic Header */}
                                <div className="px-4 -mt-12 relative z-10">
                                    <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-surface shadow-xl" style={{ borderColor: settings.themeMode === 'light' ? '#f4f4f5' : '#09090b' }}>
                                        {settings.logoUrl ? (
                                            <img src={settings.logoUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">Logo</div>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold mt-3">Barbearia do Júlio</h2>
                                    <p className="text-sm opacity-70">O melhor corte da região.</p>
                                </div>

                                {/* Action Buttons with Dynamic Colors */}
                                <div className="p-4 space-y-3 mt-2">
                                    <button
                                        className="w-full py-3 rounded-lg font-medium text-black shadow-lg shadow-primary/20 transition-transform active:scale-95"
                                        style={{ backgroundColor: settings.primaryColor }}
                                    >
                                        Agendar Horário
                                    </button>
                                    <button
                                        className="w-full py-3 rounded-lg font-medium border border-white/10 bg-white/5"
                                        style={{ color: settings.primaryColor }}
                                    >
                                        Meus Agendamentos
                                    </button>
                                </div>

                                {/* Service List Preview */}
                                <div className="p-4 space-y-4">
                                    <h3 className="font-semibold text-sm uppercase opacity-50 tracking-wider">Serviços Populares</h3>
                                    {[1, 2].map(i => (
                                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                            <div className="w-16 h-16 rounded-lg bg-white/10"></div>
                                            <div className="flex-1">
                                                <div className="h-4 w-2/3 bg-white/10 rounded mb-2"></div>
                                                <div className="h-3 w-1/3 bg-white/5 rounded"></div>
                                            </div>
                                            <div className="font-bold" style={{ color: settings.primaryColor }}>R$ 45</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-zinc-800 rounded-b-xl"></div>
                        </div>
                    ) : (
                        /* Desktop Preview Frame */
                        <div className="w-full h-[500px] border-4 border-zinc-800 rounded-xl bg-black overflow-hidden relative shadow-2xl transition-all duration-500 flex flex-col">
                            {/* Browser Bar */}
                            <div className="h-8 bg-zinc-800 flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                </div>
                                <div className="flex-1 mx-4 bg-black/30 rounded h-5 flex items-center px-2 text-[10px] text-zinc-500 font-mono">
                                    barberpro.com/book
                                </div>
                            </div>

                            {/* Desktop Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar relative" style={{
                                backgroundColor: settings.themeMode === 'light' ? '#f4f4f5' : '#09090b',
                                color: settings.themeMode === 'light' ? '#18181b' : '#fafafa'
                            }}>
                                {/* Desktop Layout Mirroring BookingFlow */}

                                {/* Banner */}
                                {settings.bannerUrl && (
                                    <div className="absolute inset-0 h-64 z-0">
                                        <img src={settings.bannerUrl} className="w-full h-full object-cover opacity-30" />
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
                                    </div>
                                )}

                                <div className="relative z-10 max-w-4xl mx-auto p-8 flex flex-col items-center">
                                    {/* Header */}
                                    <div className="text-center mb-12 mt-8">
                                        {settings.logoUrl && (
                                            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-surface shadow-2xl">
                                                <img src={settings.logoUrl} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <h1 className="font-display font-bold text-5xl tracking-widest mb-2" style={{ color: settings.themeMode === 'light' ? '#18181b' : 'white' }}>
                                            BARBER<span style={{ color: settings.primaryColor }}>PRO</span>
                                        </h1>
                                        <p className="text-lg opacity-60">Agendamento Online Premium</p>
                                    </div>

                                    {/* Simulated Services Grid */}
                                    <div className="w-full grid grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:border-primary/50 transition-colors cursor-pointer group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-lg">Corte Degradê</h4>
                                                    <span className="font-mono" style={{ color: settings.primaryColor }}>R$ 45</span>
                                                </div>
                                                <p className="text-sm opacity-60 mb-4">Corte completo com acabamento na navalha e lavagem.</p>
                                                <div className="text-xs uppercase tracking-wider font-semibold opacity-50 group-hover:text-primary transition-colors">Selecionar</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
