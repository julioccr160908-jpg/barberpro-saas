import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../services/database';
import { supabase } from '../services/supabase';

export const useSettingsQuery = (orgId?: string) => {
    return useQuery({
        queryKey: ['settings', orgId],
        queryFn: async () => {
            if (!orgId) return null;

            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('organization_id', orgId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
                console.error("Error fetching settings:", error);
            }

            // Return default settings if not found, or null to let context handle it?
            // Context logic: if (!data) create default.
            // Here we just return data or null.
            return data;
        },
        enabled: !!orgId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};
