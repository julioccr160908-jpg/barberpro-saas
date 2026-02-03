import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { db } from '../services/database';

export const useOrganization = (slug?: string) => {
    return useQuery({
        queryKey: ['organization', slug],
        queryFn: async () => {
            if (slug) {
                // Public Access: Resolve Slug
                const { data, error } = await supabase.from('organizations').select('*').eq('slug', slug).single();
                if (error) throw error;
                return data;
            } else {
                // Internal Access: Resolve via Auth
                const orgId = await db._getOrgId();
                if (!orgId) return null;
                const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).single();
                if (error) throw error;
                return data;
            }
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
        retry: false
    });
};
