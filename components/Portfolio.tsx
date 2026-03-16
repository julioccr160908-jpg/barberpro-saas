import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Review } from '../types';
import { Star, MessageSquare, Camera, LucideIcon } from 'lucide-react';
import { Card } from './ui/Card';
import { useSettingsQuery } from '../hooks/useSettingsQuery';
import { useGallery } from '../hooks/useGallery';

interface PortfolioProps {
  organizationId: string;
}

export const Portfolio: React.FC<PortfolioProps> = ({ organizationId }) => {
  const { data: serverSettings } = useSettingsQuery(organizationId);
  const primaryColor = serverSettings?.primary_color || '#D4AF37';

  const { data: gallery = [], isLoading: galleryLoading } = useGallery(organizationId);

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['portfolio-reviews', organizationId],
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

  const isLoading = galleryLoading || reviewsLoading;

  // Merge results
  const items = [
    ...gallery.map(img => ({
      id: img.id,
      imageUrl: img.image_url,
      title: img.description || 'Trabalho da Barbearia',
      subtitle: '',
      rating: undefined,
      isReview: false
    })),
    ...reviews.map(rev => ({
      id: rev.id,
      imageUrl: rev.photo_urls[0],
      title: rev.customer?.name || 'Cliente',
      subtitle: rev.comment || '',
      rating: rev.rating,
      isReview: true
    }))
  ];

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {[1, 2, 3].map(i => (
          <div key={i} className="min-w-[280px] h-[350px] bg-zinc-800/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Camera size={20} className="text-primary" /> Nosso Portfolio
        </h3>
        <span className="text-xs text-textMuted uppercase font-bold tracking-tighter">Fotos Reais de Clientes</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 pb-6 pt-2">
        {items.map((item) => (
          <div key={item.id} className="group">
            <Card noPadding className="overflow-hidden bg-zinc-900 border-zinc-800 shadow-xl group-hover:border-primary/30 transition-all duration-500 h-full flex flex-col">
              {/* Photo Display */}
              <div className="relative aspect-square overflow-hidden bg-zinc-800">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                {/* Overlay Info */}
                <div className="absolute bottom-3 left-3 right-3">
                  {item.isReview && (
                    <div className="flex gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={10}
                          className={s <= (item.rating || 0) ? '' : 'text-zinc-600'}
                          style={s <= (item.rating || 0) ? { color: primaryColor, fill: primaryColor } : {}}
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-white font-bold text-[10px] md:text-sm tracking-wide truncate">{item.title}</p>
                </div>
              </div>

              {/* Comment if exists */}
              {item.subtitle && (
                <div className="p-3 bg-zinc-900/50 backdrop-blur-sm flex-1">
                  <p className="text-[10px] md:text-xs text-zinc-400 italic line-clamp-2">
                    "{item.subtitle}"
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
