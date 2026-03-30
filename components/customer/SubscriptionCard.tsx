
import React from 'react';
import { Star, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface SubscriptionCardProps {
    subscription: any;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription }) => {
    if (!subscription) return null;
    const plan = subscription.plan;

    return (
        <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 relative overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Star size={60} className="text-primary" />
            </div>
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-primary text-xs text-black font-black uppercase rounded shadow-[0_0_15px_rgba(234,179,8,0.4)]">VIP Member</span>
                    <h3 className="text-white font-bold text-lg tracking-tight">{plan?.name}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                         <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Próxima Renovação</p>
                         <p className="text-sm text-white font-bold">{format(new Date(subscription.next_billing_date), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Status</p>
                         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ativo
                         </span>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center gap-3 text-xs text-primary font-bold">
                    <div className="bg-primary/10 p-1.5 rounded-lg">
                        <Zap size={14} />
                    </div>
                    <span>Benefícios do Clube Ativos e Disponíveis</span>
                </div>
            </div>
        </div>
    );
};
