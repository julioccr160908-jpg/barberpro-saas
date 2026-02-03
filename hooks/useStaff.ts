import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { User } from '../types';

export const useStaff = (orgId?: string) => {
    return useQuery({
        queryKey: ['staff', orgId],
        queryFn: async () => {
            if (!orgId) return [];
            const { data, error } = await supabase.from('profiles').select('*').in('role', ['BARBER', 'ADMIN']).eq('organization_id', orgId);
            if (error) throw error;

            return data.map(u => ({
                ...u,
                avatarUrl: u.avatar_url,
                jobTitle: u.job_title,
                commissionRate: u.commission_rate
            })) as User[];
        },
        enabled: !!orgId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};
