import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../services/database';
import { supabase } from '../services/supabase';
import { Appointment, AppointmentStatus } from '../types';

export const useAppointments = (filters?: { barberId?: string; customerId?: string; status?: AppointmentStatus; orgId?: string }, enabled: boolean = true, expanded: boolean = true) => {
    const queryClient = useQueryClient();

    // Query: Fetch Appointments
    const query = useQuery({
        queryKey: ['appointments', filters, expanded],
        queryFn: async () => {
            let all: Appointment[] = [];

            if (filters?.orgId) {
                // Public/Explicit Fetch
                console.log("Fetching appointments for org:", filters.orgId, "Expanded:", expanded);

                let queryBuilder = supabase.from('appointments').select(expanded ? `
                    *,
                    service:services!appointments_service_id_fkey (name, price, duration_minutes),
                    barber:profiles!appointments_barber_id_fkey (name),
                    customer:profiles!appointments_customer_id_fkey (name, phone, avatar_url)
                ` : '*').eq('organization_id', filters.orgId);

                const { data, error } = await queryBuilder;

                if (error) throw error;

                all = (data as any[]).map(a => ({
                    id: a.id,
                    barberId: a.barber_id,
                    customerId: a.customer_id,
                    serviceId: a.service_id,
                    date: a.date,
                    status: a.status,
                    service: a.service ? {
                        name: a.service.name,
                        price: a.service.price,
                        durationMinutes: a.service.duration_minutes
                    } : undefined,
                    barber: a.barber ? {
                        name: a.barber.name
                    } : undefined,
                    customer: a.customer ? {
                        name: a.customer.name,
                        phone: a.customer.phone,
                        avatarUrl: a.customer.avatar_url
                    } : undefined
                }));
            } else {
                // Auth Context Fetch
                all = await db.appointments.list({
                    customerId: filters?.customerId,
                    barberId: filters?.barberId
                });
            }

            // Client-side filtering
            let filtered = all;
            if (filters?.barberId) filtered = filtered.filter(a => a.barberId === filters.barberId);
            if (filters?.customerId) filtered = filtered.filter(a => a.customerId === filters.customerId);
            if (filters?.status) filtered = filtered.filter(a => a.status === filters.status);

            // Sort by date desc
            return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        },
        enabled: enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Mutation: Create Appointment
    const createMutation = useMutation({
        mutationFn: async (appt: Appointment) => {
            return await db.appointments.create(appt);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        }
    });

    // Mutation: Update Status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
            return await db.appointments.updateStatus(id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        }
    });

    return {
        ...query,
        appointments: query.data || [],
        createAppointment: createMutation.mutateAsync,
        updateStatus: updateStatusMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateStatusMutation.isPending
    };
};
