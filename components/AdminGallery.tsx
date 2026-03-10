import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Plus, Trash2, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { GalleryImage } from '../types';
import { useGallery } from '../hooks/useGallery';
import { useOrganization } from '../contexts/OrganizationContext';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export const AdminGallery: React.FC = () => {
    const { organization } = useOrganization();
    const { data: images = [], isPending, addImage, deleteImage, isAdding, isDeleting } = useGallery(organization?.id);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState<Partial<GalleryImage>>({
        image_url: '',
        description: '',
    });

    const handleOpenModal = () => {
        setFormData({ image_url: '', description: '' });
        setIsModalOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !organization?.id) return;

        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${organization.id}/${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('portfolio')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('portfolio')
                .getPublicUrl(fileName);

            setFormData({ ...formData, image_url: publicUrl });
            toast.success("Foto carregada com sucesso!");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(`Erro no upload: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.image_url || !organization?.id) return;

        try {
            await addImage({
                organization_id: organization.id,
                image_url: formData.image_url,
                description: formData.description || null,
                profile_id: null // In the future, we can add a barber selector here
            });
            toast.success("Foto adicionada à galeria!");
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error adding image", error);
            toast.error("Erro ao adicionar foto.");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta foto da galeria pública?')) {
            try {
                await deleteImage(id);
                toast.success("Foto removida!");
            } catch (error) {
                console.error("Error deleting image", error);
                toast.error("Erro ao remover foto.");
            }
        }
    };

    if (isPending) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white uppercase">Portfólio / Galeria</h1>
                    <p className="text-textMuted">Suas melhores obras para atrair mais clientes na página de agendamento.</p>
                </div>
                <Button onClick={handleOpenModal}>
                    <Plus size={18} className="mr-2" /> Nova Foto
                </Button>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.map((img) => (
                    <Card key={img.id} className="group relative overflow-hidden aspect-square border-white/5 hover:border-primary/50 transition-colors" noPadding>
                        <img
                            src={img.image_url}
                            alt={img.description || 'Galeria'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-sm line-clamp-2">{img.description}</p>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleDelete(img.id)}
                                disabled={isDeleting}
                                className="p-2 bg-black/60 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-colors disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </Card>
                ))}

                {images.length === 0 && (
                    <div className="col-span-full border-2 border-dashed border-white/10 rounded-xl p-12 text-center text-textMuted hover:border-primary/30 transition-colors bg-surface/30">
                        <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-white mb-1">Galeria Vazia</h3>
                        <p className="text-sm">Faça o upload de fotos dos cortes e da barbearia para impressionar seus clientes.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-border bg-surfaceHighlight/50">
                            <h2 className="text-xl font-display font-bold text-white">Nova Foto de Portfólio</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-textMuted hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-textMuted block">Foto</label>

                                <label className="aspect-[4/3] rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden relative bg-surfaceHighlight group transition-colors">
                                    {formData.image_url ? (
                                        <>
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Upload className="text-white" size={24} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            {isUploading ? (
                                                <Loader2 className="mx-auto text-primary animate-spin mb-2" size={32} />
                                            ) : (
                                                <Upload className="mx-auto text-textMuted mb-2" size={32} />
                                            )}
                                            <span className="text-xs text-textMuted block">
                                                {isUploading ? 'Enviando...' : 'Clique para enviar a foto'}
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                </label>

                                <Input
                                    label="Descrição (Opcional)"
                                    placeholder="Ex: Taper Fade feito pelo Lucas..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t border-border">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isAdding || !formData.image_url}>
                                    {isAdding ? <Loader2 className="animate-spin" size={18} /> : 'Adicionar à Galeria'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
