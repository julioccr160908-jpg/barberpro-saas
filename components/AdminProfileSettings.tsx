
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { User, Phone, Mail, Loader2, Save, Camera, X, Upload } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const AdminProfileSettings: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');


    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar_url: '',
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

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    avatar_url: data.avatar_url || '',
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

            // Invalidate cache to update UI immediately
            await queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });

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

            // Invalidate cache to update UI immediately
            await queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });

            setMessage('Perfil atualizado com sucesso!');
            toast.success("Perfil atualizado!");
        } catch (error: any) {
            console.error("Error updating profile", error);
            const errorMsg = error.message || 'Erro desconhecido';
            const errorDetails = error.details || error.hint || '';
            setMessage(`Erro: ${errorMsg}`);
            toast.error(`Erro: ${errorMsg} ${errorDetails ? `(${errorDetails})` : ''}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-surface p-6 rounded-xl border border-white/5 animate-fade-in">
            <form onSubmit={handleSave} className="space-y-6">

                <div className="flex justify-center mb-6">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full bg-surfaceHighlight border-2 border-primary/20 p-1 overflow-hidden transition-all group-hover:border-primary">
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

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                        Salvar Alterações
                    </Button>
                </div>
            </form>

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
