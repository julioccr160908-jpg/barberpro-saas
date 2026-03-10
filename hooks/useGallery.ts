import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { GalleryImage } from '../types';

export const useGallery = (orgId?: string) => {
    const queryClient = useQueryClient();

    const queryInfo = useQuery({
        queryKey: ['gallery', orgId],
        queryFn: async (): Promise<GalleryImage[]> => {
            if (!orgId) return [];

            const { data, error } = await supabase
                .from('gallery_images')
                .select('*')
                .eq('organization_id', orgId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching gallery images:", error);
                throw error;
            }

            return data as GalleryImage[];
        },
        enabled: !!orgId,
    });

    const addImageMutation = useMutation({
        mutationFn: async (newImage: Omit<GalleryImage, 'id' | 'created_at'>) => {
            const { data, error } = await supabase
                .from('gallery_images')
                .insert([newImage])
                .select()
                .single();

            if (error) throw error;
            return data as GalleryImage;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery', orgId] });
        }
    });

    const deleteImageMutation = useMutation({
        mutationFn: async (imageId: string) => {
            const { error } = await supabase
                .from('gallery_images')
                .delete()
                .eq('id', imageId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery', orgId] });
        }
    });

    return {
        ...queryInfo,
        addImage: addImageMutation.mutateAsync,
        deleteImage: deleteImageMutation.mutateAsync,
        isAdding: addImageMutation.isPending,
        isDeleting: deleteImageMutation.isPending
    };
};
