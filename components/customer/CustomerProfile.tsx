
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Phone, Mail, Loader2, Save, Gift, Check, Camera, X, Upload, CreditCard } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LoyaltyCard } from './LoyaltyCard';
import { SubscriptionCard } from './SubscriptionCard';

export const CustomerProfile: React.FC = () => {
    const { user, profile: userProfile } = useAuth();
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Fetch Subscription Status
    const { data: subscription } = useQuery({
        queryKey: ['customer-subscription', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data } = await supabase
                .from('customer_subscriptions')
                .select('*, plan:subscription_plans(*)')
                .eq('customer_id', user.id)
                .eq('status', 'active')
                .maybeSingle();
            return data;
        },
        enabled: !!user
    });


    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar_url: '',
        loyaltyCount: 0,
        loyaltyTarget: 10,
        loyaltyEnabled: false
    });

    // Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            // Settings are already in context, but loyalty details might be user-specific or org-wide?
            // Context 'settings' is org-wide.
            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    avatar_url: data.avatar_url || '',
                    loyaltyCount: data.loyalty_count || 0,
                    loyaltyTarget: settings?.loyalty_target || 10,
                    loyaltyEnabled: settings?.loyalty_enabled || false
                });
            }
        } catch (error) {
            console.error("Error loading profile", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        if (value.length > 9) value = `${value.slice(0, 9)}-${value.slice(9)}`;
        setFormData({ ...formData, phone: value });
    };

    // Image Upload Handlers
    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || '');
                setCropModalOpen(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropSave = async () => {
        if (!imageSrc || !croppedAreaPixels || !user) return;
        setUploading(true);

        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedImageBlob) throw new Error("Falha ao recortar imagem");

            const fileExt = 'jpeg';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const file = new File([croppedImageBlob], fileName, { type: "image/jpeg" });

            // Upload to 'profiles' bucket
            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(fileName);

            // Update Local State
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

            // Close Modal
            setCropModalOpen(false);
            setImageSrc(null);
            toast.success("Foto atualizada! Lembre-se de salvar o perfil.");

        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error(`Erro ao enviar imagem: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    avatar_url: formData.avatar_url
                })
                .eq('id', user?.id);

            if (error) throw error;
            setMessage('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error("Error updating profile", error);
            setMessage('Erro ao atualizar perfil.');
        } finally {
            setLoading(false);
        }
    };

    // Dynamic color helpers
    const primaryColor = settings.primary_color || '#EAB308'; // Default fallback (yellow-500)

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Meu Perfil</h2>

            {/* Hub Widgets Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Loyalty Card */}
                <LoyaltyCard 
                    count={formData.loyaltyCount} 
                    target={formData.loyaltyTarget} 
                    enabled={formData.loyaltyEnabled} 
                />

                {/* Subscription Card */}
                {subscription ? (
                    <SubscriptionCard subscription={subscription} />
                ) : (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                            <CreditCard className="text-zinc-700" size={24} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Clube de Assinatura</h4>
                            <p className="text-xs text-zinc-500">Torne-se membro e tenha cortes ilimitados.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/customer/subscriptions')} className="text-xs uppercase font-semibold tracking-wide border-white/10 hover:border-primary">
                            Ver Planos
                        </Button>
                    </div>
                )}
            </div>

            <Card>
                <form onSubmit={handleSave} className="space-y-6">

                    <div className="flex justify-center mb-6">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-surfaceHighlight border-2 p-1 overflow-hidden transition-all group-hover:border-primary" style={{ borderColor: primaryColor }}>
                                <img
                                    src={formData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.name}`}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>

                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>

                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept="image/*"
                                onChange={onFileSelect}
                            />
                        </div>
                    </div>

                    <Input
                        label="Nome Completo"
                        icon={<User size={18} />}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="E-mail"
                        icon={<Mail size={18} />}
                        name="email"
                        value={formData.email}
                        disabled
                        className="opacity-50 cursor-not-allowed" // Visually indicate disabled
                    />

                    <Input
                        label="Celular / WhatsApp"
                        icon={<Phone size={18} />}
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="(00) 00000-0000"
                    />

                    {message && (
                        <div className={`p-3 rounded-lg text-center text-sm font-medium ${message.includes('sucesso') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {message}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Crop Modal */}
            {cropModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
                    <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Ajustar Foto</h3>
                            <button onClick={() => setCropModalOpen(false)} className="text-textMuted hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                            {imageSrc && (
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    style={{
                                        containerStyle: { background: '#000' }
                                    }}
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
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full accent-primary"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setCropModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCropSave} disabled={uploading}>
                                {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" size={18} />}
                                Salvar Foto
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
