import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Service } from '../types';

export const useServices = (orgId?: string) => {
    return useQuery({
        queryKey: ['services', orgId],
        queryFn: async () => {
            if (!orgId) return [];
            const { data, error } = await supabase.from('services').select('*').eq('organization_id', orgId);
            if (error) throw error;

            return data.map(s => ({
                ...s,
                durationMinutes: s.duration_minutes,
                imageUrl: s.image_url
            })) as Service[];
        },
        enabled: !!orgId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};
