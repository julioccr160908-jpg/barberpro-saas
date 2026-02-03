import { useQuery } from '@tanstack/react-query';
import { db } from '../services/database';
import { supabase } from '../services/supabase';

export const useCustomerProfile = () => {
    return useQuery({
        queryKey: ['customerProfile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            return await db.customers.getById(user.id);
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};
