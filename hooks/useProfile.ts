import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { User, Role } from '../types';

export function useProfile(userId: string | undefined) {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // If specific error handling is needed, do it here.
                // For 'PGRST116' (no rows), returning null is often better than throwing if we handle it gracefully.
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            // Map DB snake_case to TS camelCase if necessary, or ensure types match.
            // Our User interface uses camelCase for some fields (avatarUrl, jobTitle).
            // But strict typing via Database definitions usually returns snake_case.
            // Let's map it to match the 'User' interface expected by the app.

            const profile: User = {
                id: data.id,
                email: data.email,
                name: data.name,
                role: data.role as Role,
                avatarUrl: data.avatar_url,
                jobTitle: data.job_title,
                phone: data.phone,
                commissionRate: data.commission_rate,
                loyaltyCount: data.loyalty_count
            };

            return profile;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
