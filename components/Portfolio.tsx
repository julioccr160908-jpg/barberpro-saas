import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Star, Camera, Quote } from 'lucide-react';
import { Card } from './ui/Card';
import { useSettingsQuery } from '../hooks/useSettingsQuery';
import { useGallery } from '../hooks/useGallery';

interface PortfolioProps {
  organizationId: string;
}

export const Portfolio: React.FC<PortfolioProps> = ({ organizationId }) => {
  const { data: serverSettings } = useSettingsQuery(organizationId);
  const primaryColor = serverSettings?.primary_color || '#D4AF37';

  // Query 1: Gallery images ONLY (portfolio work)
  const { data: gallery = [], isLoading: galleryLoading } = useGallery(organizationId);

  // Query 2: Reviews ONLY (client testimonials)
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['client-reviews', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, customer:customer_id(name)')
        .eq('organization_id', organizationId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as { id: string; rating: number; comment: string; photo_urls: string[]; created_at: string; customer: { name: string } | null }[];
    }
  });

  const isLoading = galleryLoading || reviewsLoading;
  const hasGallery = gallery.length > 0;
  const hasReviews = reviews.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-16">
        {/* Gallery skeleton */}
        <div className="space-y-6">
          <div className="h-6 w-48 bg-zinc-800/50 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-zinc-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
        {/* Reviews skeleton */}
        <div className="space-y-6">
          <div className="h-6 w-64 bg-zinc-800/50 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-40 bg-zinc-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasGallery && !hasReviews) return null;

  return (
    <div className="space-y-16">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SEÇÃO 1: PORTFÓLIO — Apenas fotos de trabalho          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {hasGallery && (
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Camera size={20} className="text-primary" />
            </div>
            <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">
              Nosso Portfólio
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((img) => (
              <div key={img.id} className="group">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-800 border border-zinc-800/50 group-hover:border-primary/30 transition-all duration-500">
                  <img
                    src={img.image_url}
                    alt={img.description || 'Trabalho da Barbearia'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Description overlay on hover */}
                  {img.description && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-white text-xs font-medium truncate">{img.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SEÇÃO 2: AVALIAÇÕES — Depoimentos de clientes          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {hasReviews && (
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Quote size={20} className="text-amber-500" />
            </div>
            <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">
              O Que Nossos Clientes Dizem
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reviews.map((review) => (
              <Card
                key={review.id}
                noPadding
                className="bg-zinc-900/60 border-zinc-800/50 overflow-hidden hover:border-zinc-700/50 transition-all duration-300 group"
              >
                <div className="p-5 space-y-4">
                  {/* Stars + Customer Name */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Customer avatar circle */}
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0 text-zinc-400 text-xs font-bold uppercase">
                        {review.customer?.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white tracking-tight">
                          {review.customer?.name || 'Cliente'}
                        </p>
                        {/* Stars row */}
                        <div className="flex gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              className={s <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-700'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-zinc-300 italic font-serif leading-relaxed line-clamp-4">
                      "{review.comment}"
                    </p>
                  )}

                  {/* Review photos (if any) */}
                  {review.photo_urls && review.photo_urls.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {review.photo_urls.slice(0, 3).map((url, idx) => (
                        <div
                          key={idx}
                          className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-800/50"
                        >
                          <img
                            src={url}
                            alt={`Foto da avaliação ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
