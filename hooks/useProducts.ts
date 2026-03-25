import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Product } from '../types';

export const useProducts = (orgId?: string) => {
    return useQuery({
        queryKey: ['products-upsell', orgId],
        queryFn: async (): Promise<Product[]> => {
            if (!orgId) return [];

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('organization_id', orgId)
                .gt('stock_quantity', 0)
                .order('name', { ascending: true });

            if (error) {
                console.error("Error fetching products:", error);
                throw error;
            }

            return data as Product[];
        },
        enabled: !!orgId,
    });
};
