import React, { useState } from 'react';
import { Package, Plus, Search, AlertCircle, Edit2, Trash2, TrendingUp, History, Tag } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useOrganization } from '../../contexts/OrganizationContext';
import { supabase } from '../../services/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '../../types';
import { toast } from 'sonner';

export const AdminInventory: React.FC = () => {
    const { organization } = useOrganization();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
            setIsAddModalOpen(false);
            setEditingProduct(null);
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
                <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
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
                            <h3 className="text-2xl font-bold text-white">R$ {monthlySales.toFixed(2)}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-500 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome ou categoria..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Products Table */}
            <Card className="overflow-hidden border-zinc-800 bg-zinc-900/30">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Produto</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Preço</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Estoque</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Carregando estoque...</td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Nenhum produto encontrado.</td>
                                </tr>
                            ) : filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-zinc-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {product.image_url ? (
                                                <img src={product.image_url} className="w-10 h-10 rounded-lg object-cover" alt={product.name} />
                                            ) : (
                                                <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                            <span className="font-bold text-white">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase rounded-full border border-zinc-700">
                                            {product.category || 'Geral'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-white font-mono font-bold">R$ {product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`font-bold ${product.stock_quantity <= (product.min_stock_level || 5) ? 'text-red-500' : 'text-zinc-400'}`}>
                                            {product.stock_quantity} un
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => { setEditingProduct(product); setIsAddModalOpen(true); }}
                                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => { if(confirm('Remover produto?')) deleteMutation.mutate(product.id); }}
                                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal - Simplified for now */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 p-6 animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">
                            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                        </h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const data = {
                                name: formData.get('name') as string,
                                price: parseFloat(formData.get('price') as string),
                                stock_quantity: parseInt(formData.get('stock') as string),
                                category: formData.get('category') as string,
                                min_stock_level: parseInt(formData.get('min_stock') as string),
                                id: editingProduct?.id
                            };
                            upsertMutation.mutate(data);
                        }} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Nome</label>
                                <input name="name" defaultValue={editingProduct?.name} required className="w-full bg-zinc-800 border-zinc-700 text-white p-3 rounded-xl" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Preço</label>
                                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full bg-zinc-800 border-zinc-700 text-white p-3 rounded-xl" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Estoque</label>
                                    <input name="stock" type="number" defaultValue={editingProduct?.stock_quantity} required className="w-full bg-zinc-800 border-zinc-700 text-white p-3 rounded-xl" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Categoria</label>
                                    <input name="category" defaultValue={editingProduct?.category} className="w-full bg-zinc-800 border-zinc-700 text-white p-3 rounded-xl" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Aviso Estoque Baixo</label>
                                    <input name="min_stock" type="number" defaultValue={editingProduct?.min_stock_level || 5} className="w-full bg-zinc-800 border-zinc-700 text-white p-3 rounded-xl" />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }} className="flex-1">Cancelar</Button>
                                <Button type="submit" className="flex-1">Salvar</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
