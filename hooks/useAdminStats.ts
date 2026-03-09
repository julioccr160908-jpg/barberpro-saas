
import { useMemo } from 'react';
import { useAppointments } from './useAppointments';
import { AppointmentStatus } from '../types';
import { parseISO, isSameDay, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminStats {
    revenue: number;
    scheduledRevenue: number;
    count: number;
    uniqueCustomers: number;
    occupancy: number; // Placeholder
    isLoading: boolean;
    upcomingAppointments: any[];
    chartData: any[];
    hasAnyData: boolean;
}

export const useAdminStats = (orgId: string | undefined): AdminStats => {
    // Pass orgId to filter appointments for the specific organization
    const { appointments, isLoading } = useAppointments({ orgId });

    const metrics = useMemo(() => {
        if (!appointments.length) {
            return {
                revenue: 0,
                scheduledRevenue: 0,
                count: 0,
                uniqueCustomers: 0,
                occupancy: 0
            };
        }

        // Filter valid appointments (not cancelled)
        const validAppts = appointments.filter(a => a.status !== AppointmentStatus.CANCELLED);

        // Revenue: Only COMPLETED appointments
        const completedAppts = appointments.filter(a => a.status === AppointmentStatus.COMPLETED);
        const revenue = completedAppts.reduce((sum, appt) => sum + (appt.service?.price || 0), 0);

        // Scheduled Revenue: PENDING + CONFIRMED appointments (forecast)
        const scheduledAppts = appointments.filter(a =>
            a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED
        );
        const scheduledRevenue = scheduledAppts.reduce((sum, appt) => sum + (appt.service?.price || 0), 0);

        // Count: Total active appointments
        const count = validAppts.length;

        // Unique Customers (from all valid appointments, not just completed)
        const uniqueCustomers = new Set(validAppts.map(a => a.customerId)).size;

        return {
            revenue,
            scheduledRevenue,
            count,
            uniqueCustomers,
            occupancy: 0
        };
    }, [appointments]);

    const upcomingAppointments = useMemo(() => {
        const now = new Date();
        return appointments
            .filter(a => new Date(a.date) >= now && a.status !== AppointmentStatus.CANCELLED)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5); // Take next 5
    }, [appointments]);

    const chartData = useMemo(() => {
        // Always generate last 7 days data (even if no appointments)
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = subDays(new Date(), i);
            days.push(d);
        }

        return days.map(day => {
            // COMPLETED appointments = realized revenue
            const dayRevenue = appointments
                .filter(a => isSameDay(new Date(a.date), day) && a.status === AppointmentStatus.COMPLETED)
                .reduce((sum, a) => sum + (a.service?.price || 0), 0);

            // PENDING + CONFIRMED = scheduled/expected revenue
            const dayScheduled = appointments
                .filter(a => isSameDay(new Date(a.date), day) &&
                    (a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED))
                .reduce((sum, a) => sum + (a.service?.price || 0), 0);

            return {
                name: format(day, 'EEE', { locale: ptBR }),
                value: dayRevenue,
                scheduled: dayScheduled,
                fullDate: format(day, 'dd/MM/yyyy')
            };
        });
    }, [appointments]);

    // Check if there's any meaningful data at all
    const hasAnyData = chartData.some(d => d.value > 0 || d.scheduled > 0);

    return {
        ...metrics,
        upcomingAppointments,
        chartData,
        hasAnyData,
        isLoading
    };
};
