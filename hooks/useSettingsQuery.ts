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
                .maybeSingle();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
                console.error("Error fetching settings:", error);
            }

            // Parse schedule if it's a string (JSON stored as text)
            if (data && data.schedule && typeof data.schedule === 'string') {
                try {
                    data.schedule = JSON.parse(data.schedule);
                } catch (e) {
                    console.error("Error parsing schedule JSON:", e);
                    data.schedule = [];
                }
            }

            // Ensure schedule is always an array
            if (data && !Array.isArray(data.schedule)) {
                data.schedule = [];
            }

            return data;
        },
        enabled: !!orgId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};

