import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { AppointmentStatus } from '../types';

export const useBarberStats = (barberId: string | undefined) => {
    // 1. Fetch Appointments
    const { data: appointments = [], isLoading: isApptsLoading } = useQuery({
        queryKey: ['barber-appointments', barberId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('appointments')
                .select('*, service:service_id(price, name)')
                .eq('barber_id', barberId)
                .order('date', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!barberId
    });

    // 2. Fetch Sales
    const { data: sales = [], isLoading: isSalesLoading } = useQuery({
        queryKey: ['barber-sales', barberId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sales')
                .select('*')
                .eq('barber_id', barberId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!barberId
    });

    const stats = useMemo(() => {
        if (!appointments.length && !sales.length) {
            return {
                serviceRevenue: 0,
                productRevenue: 0,
                totalRevenue: 0,
                appointmentCount: 0,
                averageTicket: 0,
                retentionRate: 0,
                topServices: [] as { name: string; count: number }[]
            };
        }

        const completedAppts = appointments.filter(a => a.status === AppointmentStatus.COMPLETED);
        const serviceRevenue = completedAppts.reduce((sum, a) => sum + ((a as any).service?.price || 0), 0);
        const productRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
        
        const totalRevenue = serviceRevenue + productRevenue;
        const appointmentCount = completedAppts.length;
        const averageTicket = appointmentCount > 0 ? totalRevenue / appointmentCount : 0;

        // Retention: % of unique customers with > 1 completed appointment
        const customerApptCounts = new Map<string, number>();
        completedAppts.forEach(a => {
            const cId = a.customer_id || (a as any).customerId;
            if (cId) {
                customerApptCounts.set(cId, (customerApptCounts.get(cId) || 0) + 1);
            }
        });
        
        const recurringCustomers = Array.from(customerApptCounts.values()).filter(count => count > 1).length;
        const totalUniqueCustomers = customerApptCounts.size;
        const retentionRate = totalUniqueCustomers > 0 ? (recurringCustomers / totalUniqueCustomers) * 100 : 0;

        // Top Services
        const serviceMap = new Map<string, number>();
        completedAppts.forEach(a => {
            const name = (a as any).service?.name || 'Serviço';
            serviceMap.set(name, (serviceMap.get(name) || 0) + 1);
        });
        
        const topServices = Array.from(serviceMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            serviceRevenue,
            productRevenue,
            totalRevenue,
            appointmentCount,
            averageTicket,
            retentionRate,
            topServices
        };
    }, [appointments, sales]);

    return {
        ...stats,
        isLoading: isApptsLoading || isSalesLoading
    };
};
