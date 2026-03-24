
import React from 'react';
import { Scissors } from 'lucide-react';

interface LoyaltyCardProps {
    count: number;
    target: number;
    enabled: boolean;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ count, target, enabled }) => {
    if (!enabled) return null;
    const missing = Math.max(0, target - count);

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-br from-zinc-800 to-black rounded-3xl border border-white/10 p-6 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Scissors size={100} />
                </div>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Cartão de Selos</p>
                        <h4 className="text-white font-bold text-lg">Fidelidade Premium</h4>
                    </div>
                    <div className="bg-primary/20 rounded-full px-3 py-1 text-xs text-primary font-bold border border-primary/20">
                        {count}/{target}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center py-2">
                    {Array.from({ length: target }).map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-500 ${
                                i < count
                                ? 'bg-primary border-primary shadow-[0_0_15px_rgba(234,179,8,0.3)] text-black font-bold' 
                                : 'bg-white/5 border-white/10 text-zinc-700'
                            }`}
                        >
                            <Scissors size={18} />
                        </div>
                    ))}
                </div>
            </div>
            
            <p className="text-sm text-center font-medium text-zinc-400 animate-pulse">
                {missing === 0 
                    ? "✨ Cartela completa! Resgate seu prêmio."
                    : `Faltam apenas ${missing} cortes para o seu próximo presente! 🎁`}
            </p>
        </div>
    );
};
