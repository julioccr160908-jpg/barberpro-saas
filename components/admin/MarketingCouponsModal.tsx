import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Tag, Percent, BadgeDollarSign, Loader2, Power, Pause } from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { supabase } from '../../services/supabase';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface CouponForm {
    code: string;
    discount_type: 'PERCENTAGE' | 'FIXED';
    discount_value: number;
    valid_until?: string;
    max_uses?: number;
}

interface Coupon {
    id: string;
    code: string;
    discount_type: 'PERCENTAGE' | 'FIXED';
    discount_value: number;
    current_uses: number;
    max_uses: number | null;
    is_active: boolean;
    valid_until: string | null;
}

export const MarketingCouponsModal = ({ onClose }: { onClose: () => void }) => {
    const { organization } = useOrganization();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CouponForm>({
        defaultValues: { discount_type: 'PERCENTAGE' }
    });

    const fetchCoupons = async () => {
        if (!organization) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('organization_id', organization.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching coupons', error);
        } else {
            setCoupons(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCoupons();
    }, [organization]);

    const onSubmit = async (data: CouponForm) => {
        if (!organization) return;
        setIsCreating(true);

        const payload = {
            organization_id: organization.id,
            code: data.code.toUpperCase(),
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            max_uses: data.max_uses || null,
            valid_until: data.valid_until ? new Date(data.valid_until).toISOString() : null,
        };

        const { error } = await supabase.from('coupons').insert([payload]);

        if (error) {
            if (error.code === '23505') {
                toast.error('Já existe um cupom com este código.');
            } else {
                toast.error('Erro ao criar cupom.');
            }
        } else {
            toast.success('Cupom criado com sucesso!');
            reset();
            fetchCoupons();
        }
        setIsCreating(false);
    };

    const toggleStatus = async (coupon: Coupon) => {
        const { error } = await supabase
            .from('coupons')
            .update({ is_active: !coupon.is_active })
            .eq('id', coupon.id);
        
        if (error) {
            toast.error('Erro ao alterar status');
        } else {
            setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
            toast.success(coupon.is_active ? 'Cupom pausado!' : 'Cupom reativado!');
        }
    };

    const deleteCoupon = async (id: string) => {
        if (!confirm('Excluir este cupom permanentemente?')) return;
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) toast.error('Erro ao excluir.');
        else {
            toast.success('Cupom excluído.');
            fetchCoupons();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl bg-[#09090b] h-full shadow-2xl flex flex-col border-l border-white/10 animate-slide-in-right">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Tag className="text-yellow-500" />
                            Promoções Relâmpago
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1">Crie cupons de desconto para agendamentos.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white rounded-lg transition-colors bg-white/5">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl space-y-4">
                        <h3 className="font-bold text-white mb-2">Novo Cupom</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Código Promocional</label>
                                    <input
                                        {...register('code', { required: 'Código é obrigatório' })}
                                        className={`w-full bg-black/40 border ${errors.code ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-3 py-2 text-white text-sm uppercase focus:ring-1 focus:ring-white/20 outline-none`}
                                        placeholder="EX: NATAL20"
                                    />
                                    {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Tipo de Desconto</label>
                                <select
                                    {...register('discount_type')}
                                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
                                >
                                    <option value="PERCENTAGE">Porcentagem (%)</option>
                                    <option value="FIXED">Valor Fixo (R$)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Valor</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('discount_value', { 
                                        required: 'Insira um valor', 
                                        min: { value: 0.1, message: 'Valor deve ser > 0' } 
                                    })}
                                    className={`w-full bg-black/40 border ${errors.discount_value ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-white/20 outline-none`}
                                />
                                {errors.discount_value && <p className="text-xs text-red-500 mt-1">{errors.discount_value.message}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Válido Até (Opcional)</label>
                                <input
                                    type="date"
                                    {...register('valid_until')}
                                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-white/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Limite Usos</label>
                                <input
                                    type="number"
                                    placeholder="Ilimitado"
                                    {...register('max_uses', { min: 1 })}
                                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-700"
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={isCreating} className="w-full bg-white text-black hover:bg-zinc-200">
                            {isCreating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                            Criar Cupom
                        </Button>
                    </form>

                    {/* List */}
                    <div>
                        <h3 className="font-bold text-white mb-4">Cupons Ativos</h3>
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="animate-spin text-zinc-500" />
                            </div>
                        ) : coupons.length === 0 ? (
                            <div className="text-center p-8 border border-dashed border-zinc-800 rounded-2xl">
                                <p className="text-zinc-500 text-sm">Nenhum cupom criado ainda.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {coupons.map(coupon => (
                                    <div key={coupon.id} className={`flex items-center justify-between p-4 rounded-xl border ${coupon.is_active ? 'bg-zinc-900 border-zinc-800' : 'bg-black/40 border-zinc-900 opacity-60'}`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-white tracking-wider">{coupon.code}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${coupon.discount_type === 'PERCENTAGE' ? 'bg-primary/20 text-primary' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                    {coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}% OFF` : `R$ ${coupon.discount_value} OFF`}
                                                </span>
                                            </div>
                                            <div className="text-xs text-zinc-500 flex items-center gap-3">
                                                <span>Usos: {coupon.current_uses} / {coupon.max_uses || '∞'}</span>
                                                {coupon.valid_until && (
                                                    <span>Vence: {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => toggleStatus(coupon)}
                                                className={`p-2 rounded-lg transition-colors ${coupon.is_active ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-zinc-500 hover:bg-white/5'}`}
                                                title={coupon.is_active ? "Pausar Cupom" : "Reativar Cupom"}
                                            >
                                                {coupon.is_active ? <Pause size={18} /> : <Power size={18} />}
                                            </button>
                                            <button 
                                                onClick={() => deleteCoupon(coupon.id)}
                                                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
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
