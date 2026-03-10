import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Review } from '../types';
import { Star, MessageSquare, Camera } from 'lucide-react';
import { Card } from './ui/Card';
import { useSettingsQuery } from '../hooks/useSettingsQuery';

interface PortfolioProps {
  organizationId: string;
}

export const Portfolio: React.FC<PortfolioProps> = ({ organizationId }) => {
  const { data: serverSettings } = useSettingsQuery(organizationId);
  const primaryColor = serverSettings?.primary_color || '#D4AF37';
  
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['portfolio', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, customer:customer_id(name)')
        .eq('organization_id', organizationId)
        .eq('is_public', true)
        .not('photo_urls', 'eq', '{}')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Review & { customer: { name: string } })[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {[1, 2, 3].map(i => (
          <div key={i} className="min-w-[280px] h-[350px] bg-zinc-800/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Camera size={20} className="text-primary" /> Nosso Portfolio
        </h3>
        <span className="text-xs text-textMuted uppercase font-bold tracking-tighter">Fotos Reais de Clientes</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 custom-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
        {reviews.map((review) => (
          <div key={review.id} className="min-w-[300px] flex-shrink-0 group">
            <Card noPadding className="overflow-hidden bg-zinc-900 border-zinc-800 shadow-xl group-hover:border-primary/30 transition-all duration-500">
              {/* Photo Display (taking the first one) */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <img 
                  src={review.photo_urls[0]} 
                  alt="Trabalho Barbeiro" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                
                {/* Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={12} 
                        className={s <= review.rating ? '' : 'text-zinc-600'} 
                        style={s <= review.rating ? { color: primaryColor, fill: primaryColor } : {}}
                      />
                    ))}
                  </div>
                  <p className="text-white font-bold text-sm tracking-wide truncate">{review.customer?.name || 'Cliente'}</p>
                </div>
              </div>

              {/* Comment if exists */}
              {review.comment && (
                <div className="p-4 bg-zinc-900/50 backdrop-blur-sm">
                   <p className="text-xs text-zinc-400 italic line-clamp-2">
                     "{review.comment}"
                   </p>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
