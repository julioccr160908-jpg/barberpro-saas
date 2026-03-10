import React, { useState } from 'react';
import { Star, Upload, X, Check, Loader2, Camera } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

interface ReviewModalProps {
  appointmentId: string;
  organizationId: string;
  barberId?: string;
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ 
  appointmentId, 
  organizationId, 
  barberId, 
  customerId, 
  onClose, 
  onSuccess 
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (photos.length + newFiles.length > 3) {
        toast.error('Limite de 3 fotos por avaliação.');
        return;
      }
      setPhotos([...photos, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const photoUrls: string[] = [];

      // Upload Photos
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${organizationId}/reviews/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('portfolio')
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio')
          .getPublicUrl(filePath);
        
        photoUrls.push(publicUrl);
      }

      // Save Review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert([{
          organization_id: organizationId,
          appointment_id: appointmentId,
          customer_id: customerId,
          barber_id: barberId,
          rating,
          comment,
          photo_urls: photoUrls,
          is_public: true
        }]);

      if (reviewError) throw reviewError;

      toast.success('Avaliação enviada com sucesso! Obrigado pelo feedback.');
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao enviar avaliação: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-yellow-500/5 blur-[80px] rounded-full" />

        <div className="relative z-10 text-center space-y-6">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-yellow-500/20">
            <Star className="text-yellow-500 w-8 h-8 fill-yellow-500" />
          </div>
          
          <div>
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">Como foi seu corte?</h2>
            <p className="text-zinc-500 text-sm mt-1">Sua avaliação ajuda outros clientes e valoriza nossos profissionais.</p>
          </div>

          {/* Rating */}
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transform transition-all active:scale-90"
              >
                <Star 
                  size={40} 
                  className={`${rating >= star ? 'text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'text-zinc-800'} transition-all`}
                />
              </button>
            ))}
          </div>

          {/* Comment */}
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Comentário (opcional)</label>
            <textarea
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all min-h-[100px] resize-none"
              placeholder="Conte como foi sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-3 text-left">
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Fotos do seu novo visual</label>
            <div className="grid grid-cols-4 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-zinc-800">
                  <img 
                    src={URL.createObjectURL(photo)} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                    alt="Review" 
                  />
                  <button 
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all text-zinc-600 hover:text-yellow-500">
                  <Camera size={20} />
                  <span className="text-[10px] font-bold uppercase">Add Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} multiple />
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button variant="ghost" fullWidth onClick={onClose} disabled={isSubmitting}>Agora não</Button>
            <Button fullWidth onClick={handleSubmit} disabled={isSubmitting} className="shadow-[0_4px_20px_rgba(234,179,8,0.3)]">
              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Enviar Avaliação'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
