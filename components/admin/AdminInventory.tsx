import React, { useState } from 'react';
import { Package, Plus, Search, AlertCircle, Edit2, Trash2, TrendingUp, Upload, Loader2, Minus, Tag } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useOrganization } from '../../contexts/OrganizationContext';
import { supabase } from '../../services/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '../../types';
import { toast } from 'sonner';
import { ImageCropperModal } from '../ui/ImageCropperModal';

export const AdminInventory: React.FC = () => {
    const { organization } = useOrganization();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formDataUrl, setFormDataUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

    // Fetch Products
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products', organization?.id],
        queryFn: async () => {
            if (!organization?.id) return [];
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('organization_id', organization.id)
                .order('name');
            if (error) throw error;
            return data as Product[];
        },
        enabled: !!organization?.id
    });

    // Fetch Monthly Sales
    const { data: monthlySales = 0 } = useQuery({
        queryKey: ['monthly_sales', organization?.id],
        queryFn: async () => {
            if (!organization?.id) return 0;
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('sales')
                .select('total_amount')
                .eq('organization_id', organization.id)
                .gte('created_at', startOfMonth.toISOString());
            
            if (error) throw error;
            return data.reduce((sum, s) => sum + Number(s.total_amount), 0);
        },
        enabled: !!organization?.id
    });

    // Mutations
    const upsertMutation = useMutation({
        mutationFn: async (product: Partial<Product>) => {
            const { data, error } = await supabase
                .from('products')
                .upsert({
                    ...product,
                    organization_id: organization?.id
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(editingProduct ? 'Produto atualizado' : 'Produto adicionado');
            handleCloseModal();
        },
        onError: (error: any) => {
            toast.error('Erro ao salvar produto: ' + error.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Produto removido');
        }
    });

    // Quick Update Stock Function
    const updateStockMutation = useMutation({
        mutationFn: async ({ id, newStock }: { id: string, newStock: number }) => {
            const { error } = await supabase
                .from('products')
                .update({ stock_quantity: newStock })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Estoque atualizado');
        }
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !organization?.id) return;

        // Limpa o target pro usuário poder selecionar a mesma imagem de novo se cancelar
        e.target.value = '';

        // Lê o arquivo pra renderizar no Canvas e intercepta antes de enviar à nuvem
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const processAndUploadCroppedImage = async (croppedBlob: Blob) => {
        if (!organization?.id) return;

        try {
            setCropImageSrc(null); // Fecha o modal de recorte
            setIsUploading(true);
            const fileName = `${organization.id}/${Date.now()}.webp`; // O Blob já vem tipado como webp pela nossa função auxiliar

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, croppedBlob);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            setFormDataUrl(publicUrl);
            toast.success("Foto processada e carregada com sucesso!");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(`Erro no upload da foto: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormDataUrl(product.image_url || '');
        } else {
            setEditingProduct(null);
            setFormDataUrl('');
        }
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingProduct(null);
        setFormDataUrl('');
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const lowStockProducts = products.filter(p => p.stock_quantity <= (p.min_stock_level || 5));

    if (!organization) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Estoque e Produtos</h1>
                    <p className="text-zinc-400">Gerencie seus produtos e acompanhe as vendas.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2 shadow-lg shadow-primary/10">
                    <Plus size={18} />
                    Novo Produto
                </Button>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-zinc-900/50 border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 font-medium">Total de Itens</p>
                            <h3 className="text-2xl font-bold text-white">{products.length}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-zinc-900/50 border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 font-medium">Estoque Baixo</p>
                            <h3 className="text-2xl font-bold text-white">{lowStockProducts.length}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-zinc-900/50 border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 font-medium">Vendas (Mês)</p>
                            <h3 className="text-2xl font-bold text-white">
                                {monthlySales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-400 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome ou categoria..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 transition-all font-medium placeholder:text-zinc-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Products Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="animate-spin text-amber-400" size={32} />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center p-12 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl">
                    <Package size={48} className="mx-auto text-zinc-700 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Nenhum produto encontrado</h3>
                    <p className="text-zinc-500">Adicione seu primeiro produto para começar a vender.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProducts.map((product) => {
                        const isLowStock = product.stock_quantity <= (product.min_stock_level || 5);
                        const isOutOfStock = product.stock_quantity === 0;

                        return (
                            <div key={product.id} className="group bg-zinc-900/50 border border-zinc-800/80 hover:border-amber-400/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/5 relative flex flex-col">
                                
                                {/* Image Container */}
                                <div className="aspect-square bg-zinc-950/50 relative overflow-hidden group">
                                    {product.image_url ? (
                                        <img 
                                            src={product.image_url} 
                                            alt={product.name} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-800 group-hover:text-zinc-700 transition-colors">
                                            <Package size={48} strokeWidth={1} />
                                        </div>
                                    )}

                                    {/* Category Badge overlaying image */}
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/5 text-[10px] items-center gap-1 font-bold text-zinc-300 uppercase tracking-wider flex">
                                        <Tag size={10} />
                                        {product.category || 'Geral'}
                                    </div>
                                    
                                    {/* Action Hover Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex justify-between items-end gap-2">
                                        
                                        <div className="flex bg-zinc-800/80 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden divide-x divide-white/5">
                                            <button 
                                                onClick={() => updateStockMutation.mutate({ id: product.id, newStock: Math.max(0, product.stock_quantity - 1) })}
                                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                                                title="Reduzir Estoque"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <button 
                                                onClick={() => updateStockMutation.mutate({ id: product.id, newStock: product.stock_quantity + 1 })}
                                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                                                title="Adicionar Estoque"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleOpenModal(product)}
                                                className="p-2 bg-zinc-800/80 backdrop-blur-sm border border-white/10 text-zinc-300 hover:text-white hover:bg-blue-500/50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => { if(confirm('Remover produto definitivamente?')) deleteMutation.mutate(product.id); }}
                                                className="p-2 bg-zinc-800/80 backdrop-blur-sm border border-white/10 text-zinc-300 hover:text-white hover:bg-red-500/50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex flex-col flex-1">
                                    <h3 className="text-white font-bold leading-tight mb-1 line-clamp-2">{product.name}</h3>
                                    <div className="mt-auto pt-3 flex items-center justify-between">
                                        <span className="text-amber-400 font-mono font-bold">
                                            {Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                        
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border flex gap-1 items-center
                                            ${isOutOfStock ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                            : isLowStock ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                                            : 'bg-green-500/10 text-green-400 border-green-500/20'}`}
                                        >
                                            {isOutOfStock ? 'Esgotado' : `${product.stock_quantity} un`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Criação / Edição */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 p-0 animate-scale-in overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-zinc-500 hover:text-white transition-colors">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-700">
                            <form id="productForm" onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const data = {
                                    name: formData.get('name') as string,
                                    price: parseFloat(formData.get('price') as string),
                                    stock_quantity: parseInt(formData.get('stock') as string),
                                    category: formData.get('category') as string,
                                    min_stock_level: parseInt(formData.get('min_stock') as string),
                                    image_url: formDataUrl || null,
                                    id: editingProduct?.id
                                };
                                upsertMutation.mutate(data);
                            }} className="space-y-5">
                                
                                {/* Image Upload Area */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Foto do Produto</label>
                                    <label className="aspect-[21/9] w-full rounded-xl border-2 border-dashed border-zinc-700 hover:border-amber-400/50 cursor-pointer flex items-center justify-center overflow-hidden relative bg-zinc-950/50 group transition-all">
                                        {formDataUrl ? (
                                            <>
                                                <img src={formDataUrl} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col gap-2">
                                                    <Upload className="text-white" size={24} />
                                                    <span className="text-white text-xs font-medium">Trocar Imagem</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                {isUploading ? (
                                                    <Loader2 className="mx-auto text-amber-400 animate-spin mb-2" size={32} />
                                                ) : (
                                                    <Upload className="mx-auto text-zinc-600 group-hover:text-amber-400 transition-colors mb-2" size={32} />
                                                )}
                                                <span className="text-xs text-zinc-500 block">
                                                    {isUploading ? 'Enviando ao servidor...' : 'Clique para selecionar a foto'}
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
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Nome</label>
                                    <input name="name" defaultValue={editingProduct?.name} required placeholder="Ex: Pomada Efeito Matte 150g" className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white p-3 rounded-xl transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Preço (R$)</label>
                                        <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required placeholder="0.00" className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white p-3 rounded-xl transition-all font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Qtd Estoque</label>
                                        <input name="stock" type="number" defaultValue={editingProduct?.stock_quantity} required placeholder="Ex: 50" className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white p-3 rounded-xl transition-all font-mono" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Categoria</label>
                                        <input name="category" defaultValue={editingProduct?.category} placeholder="Ex: Cabelo, Barba..." className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white p-3 rounded-xl transition-all" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1" title="Avisa quando estoque ficar abaixo deste valor">Alerta Baixo</label>
                                        <input name="min_stock" type="number" defaultValue={editingProduct?.min_stock_level || 5} placeholder="Ex: 5" className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white p-3 rounded-xl transition-all font-mono" />
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 shrink-0 flex gap-4">
                            <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">Cancelar</Button>
                            <Button type="submit" form="productForm" className="flex-1 shadow-lg shadow-amber-400/10" disabled={isUploading || upsertMutation.isPending}>
                                {upsertMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : (editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal de Crop da Imagem Interceptada */}
            {cropImageSrc && (
                <ImageCropperModal
                    imageSrc={cropImageSrc}
                    onCropComplete={processAndUploadCroppedImage}
                    onCancel={() => setCropImageSrc(null)}
                />
            )}
        </div>
    );
};
