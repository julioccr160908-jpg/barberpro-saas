import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Share2, Users, MousePointerClick, CheckCircle2, Loader2, Power, Pause, Copy } from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { supabase } from '../../services/supabase';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface AffiliateForm {
    influencer_name: string;
    slug_suffix: string;
    discount_type: 'PERCENTAGE' | 'FIXED' | 'NONE';
    discount_value?: number;
}

interface AffiliateLink {
    id: string;
    influencer_name: string;
    slug_suffix: string;
    discount_type: 'PERCENTAGE' | 'FIXED' | null;
    discount_value: number | null;
    clicks: number;
    conversions: number;
    is_active: boolean;
}

export const MarketingAffiliatesModal = ({ onClose }: { onClose: () => void }) => {
    const { organization } = useOrganization();
    const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const { register, handleSubmit, reset, watch } = useForm<AffiliateForm>({
        defaultValues: { discount_type: 'NONE' }
    });

    const watchDiscountType = watch('discount_type');

    const fetchAffiliates = async () => {
        if (!organization) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('affiliate_links')
            .select('*')
            .eq('organization_id', organization.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching affiliates', error);
        } else {
            setAffiliates(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchAffiliates();
    }, [organization]);

    const onSubmit = async (data: AffiliateForm) => {
        if (!organization) return;
        setIsCreating(true);

        const suffix = data.slug_suffix.toLowerCase().replace(/[^a-z0-9-]/g, '');

        const payload = {
            organization_id: organization.id,
            influencer_name: data.influencer_name,
            slug_suffix: suffix,
            discount_type: data.discount_type === 'NONE' ? null : data.discount_type,
            discount_value: data.discount_type === 'NONE' ? null : data.discount_value,
        };

        const { error } = await supabase.from('affiliate_links').insert([payload]);

        if (error) {
            if (error.code === '23505') {
                toast.error('Já existe um link com este sufixo.');
            } else {
                toast.error('Erro ao criar link de afiliado.');
            }
        } else {
            toast.success('Link criado com sucesso!');
            reset();
            fetchAffiliates();
        }
        setIsCreating(false);
    };

    const toggleStatus = async (aff: AffiliateLink) => {
        const { error } = await supabase
            .from('affiliate_links')
            .update({ is_active: !aff.is_active })
            .eq('id', aff.id);
        
        if (error) {
            toast.error('Erro ao alterar status');
        } else {
            setAffiliates(prev => prev.map(a => a.id === aff.id ? { ...a, is_active: !a.is_active } : a));
            toast.success(aff.is_active ? 'Link pausado!' : 'Link reativado!');
        }
    };

    const deleteAffiliate = async (id: string) => {
        if (!confirm('Excluir este link permanentemente?')) return;
        const { error } = await supabase.from('affiliate_links').delete().eq('id', id);
        if (error) toast.error('Erro ao excluir.');
        else {
            toast.success('Link excluído.');
            fetchAffiliates();
        }
    };

    const copyToClipboard = (suffix: string) => {
        const url = `${window.location.origin}/${organization?.slug}?ref=${suffix}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência!');
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl bg-[#09090b] h-full shadow-2xl flex flex-col border-l border-white/10 animate-slide-in-right">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Share2 className="text-emerald-500" />
                            Programa de Afiliados
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1">Crie links rastreáveis de indicação para influenciadores.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white rounded-lg transition-colors bg-white/5">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl space-y-4">
                        <h3 className="font-bold text-white mb-2">Novo Influenciador / Parceiro</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome do Parceiro</label>
                                <input
                                    {...register('influencer_name', { required: true })}
                                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
                                    placeholder="EX: Maria Souza"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Sufixo do Link (?ref=)</label>
                                <input
                                    {...register('slug_suffix', { required: true })}
                                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm lowercase"
                                    placeholder="EX: maria"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Desconto Vinculado</label>
                                <select
                                    {...register('discount_type')}
                                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
                                >
                                    <option value="NONE">Nenhum Desconto</option>
                                    <option value="PERCENTAGE">Porcentagem (%)</option>
                                    <option value="FIXED">Valor Fixo (R$)</option>
                                </select>
                            </div>
                            {watchDiscountType !== 'NONE' && (
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Valor do Desconto</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('discount_value', { required: String(watchDiscountType) !== 'NONE', min: 0.1 })}
                                        className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                </div>
                            )}
                        </div>

                        <Button type="submit" disabled={isCreating} className="w-full bg-white text-black hover:bg-zinc-200 mt-2">
                            {isCreating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                            Gerar Link Rastreável
                        </Button>
                    </form>

                    {/* List */}
                    <div>
                        <h3 className="font-bold text-white mb-4 flex items-center justify-between">
                            Links Gerados
                            <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full">{affiliates.length} Ativos</span>
                        </h3>
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="animate-spin text-zinc-500" />
                            </div>
                        ) : affiliates.length === 0 ? (
                            <div className="text-center p-8 border border-dashed border-zinc-800 rounded-2xl">
                                <p className="text-zinc-500 text-sm">Nenhum parceiro ou influencer cadastrado.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {affiliates.map(aff => (
                                    <div key={aff.id} className={`p-4 rounded-xl border ${aff.is_active ? 'bg-zinc-900 border-zinc-800' : 'bg-black/40 border-zinc-900 opacity-60'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                                    <Users size={14} className="text-zinc-400" />
                                                    {aff.influencer_name}
                                                </h4>
                                                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                                                    ?ref=<span className="font-mono text-emerald-400 font-bold">{aff.slug_suffix}</span>
                                                    <button onClick={() => copyToClipboard(aff.slug_suffix)} className="hover:text-white" title="Copiar URL Inteira"><Copy size={12} /></button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => toggleStatus(aff)}
                                                    className={`p-1.5 rounded-lg transition-colors ${aff.is_active ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-zinc-500 hover:bg-white/5'}`}
                                                    title={aff.is_active ? "Desativar Link" : "Reativar Link"}
                                                >
                                                    {aff.is_active ? <Pause size={16} /> : <Power size={16} />}
                                                </button>
                                                <button 
                                                    onClick={() => deleteAffiliate(aff.id)}
                                                    className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 rounded-lg">
                                            <div className="text-center border-r border-white/5">
                                                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1 flex items-center justify-center gap-1"><MousePointerClick size={10} /> Cliques</div>
                                                <span className="font-display font-bold text-white text-lg">{aff.clicks}</span>
                                            </div>
                                            <div className="text-center border-r border-white/5">
                                                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1 flex items-center justify-center gap-1"><CheckCircle2 size={10} /> Agendamentos</div>
                                                <span className="font-display font-bold text-emerald-500 text-lg">{aff.conversions}</span>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Desconto</div>
                                                <span className="font-bold text-zinc-300 text-sm mt-1 block">
                                                    {aff.discount_type === 'PERCENTAGE' ? `${aff.discount_value}%` : aff.discount_type === 'FIXED' ? `R$${aff.discount_value}` : 'Nenhum'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
