import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { AppointmentStatus } from '../types';
import { subDays, isBefore, parseISO } from 'date-fns';

export interface InactiveCustomer {
    id: string;
    name: string;
    phone: string | null;
    lastAppointmentDate: string;
    lastService: string;
    daysInactive: number;
}

export const useInactiveCustomers = (orgId: string | undefined) => {
    const { data: appointments = [], isLoading } = useQuery({
        queryKey: ['inactive-customers', orgId],
        queryFn: async () => {
            if (!orgId) return [];
            
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    date,
                    status,
                    customer_id,
                    customer:customer_id(id, name, phone),
                    service:service_id(name)
                `)
                .eq('organization_id', orgId)
                .order('date', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!orgId
    });

    const inactiveCustomers = useMemo(() => {
        if (!appointments.length) return [];

        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);
        
        // Group by customer
        const customerMap = new Map<string, any>();

        appointments.forEach(appt => {
            const customer = appt.customer as any;
            if (!customer) return;
            
            const cId = customer.id;
            if (!customerMap.has(cId)) {
                customerMap.set(cId, {
                    customer,
                    appointments: []
                });
            }
            customerMap.get(cId).appointments.push(appt);
        });

        const list: InactiveCustomer[] = [];

        customerMap.forEach(({ customer, appointments: appts }) => {
            // Check if they have ANY future or recent appointments (Pending/Confirmed)
            const hasFutureBooking = appts.some((a: any) => 
                (a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED) &&
                !isBefore(parseISO(a.date), now)
            );

            if (hasFutureBooking) return;

            // Find last COMPLETED appointment
            const completed = appts
                .filter((a: any) => a.status === AppointmentStatus.COMPLETED)
                .sort((a: any, b: any) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

            if (completed.length > 0) {
                const lastAppt = completed[0];
                const lastDate = parseISO(lastAppt.date);

                if (isBefore(lastDate, thirtyDaysAgo)) {
                    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    list.push({
                        id: customer.id,
                        name: customer.name || 'Cliente',
                        phone: customer.phone,
                        lastAppointmentDate: lastAppt.date,
                        lastService: lastAppt.service?.name || 'Serviço',
                        daysInactive: diffDays
                    });
                }
            }
        });

        return list.sort((a, b) => b.daysInactive - a.daysInactive);
    }, [appointments]);

    return {
        inactiveCustomers,
        isLoading
    };
};
