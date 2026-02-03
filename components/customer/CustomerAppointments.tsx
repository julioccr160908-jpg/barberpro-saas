import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, Clock, Scissors, AlertTriangle, User as UserIcon, MapPin } from 'lucide-react';
import { format, isAfter, addHours, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAppointments } from '../../hooks/useAppointments';
import { useSettingsQuery } from '../../hooks/useSettingsQuery';
import { useOrganization } from '../../hooks/useOrganization';
import { AppointmentStatus } from '../../types';
import { Skeleton } from '../ui/Skeleton';

export const CustomerAppointments: React.FC = () => {
    const { user, loading: authLoading } = useAuth();

    // 1. Get Organization (Internal)
    const { data: org, isLoading: isOrgLoading } = useOrganization();
    const orgId = org?.id;

    // 2. Get Settings & Appointments
    const { data: settingsData, isLoading: isSettingsLoading } = useSettingsQuery(orgId);
    const {
        appointments,
        isLoading: isAppointmentsLoading,
        updateStatus
    } = useAppointments({ customerId: user?.id, orgId });

    const isLoading = authLoading || isOrgLoading || isSettingsLoading || isAppointmentsLoading;

    // Computed Settings with defaults
    const settings = useMemo(() => ({
        primary_color: org?.primary_color || settingsData?.primary_color || '#D4AF37',
        // ... other settings if needed, but this component mainly uses colors and address
        address: settingsData?.address || '',
        city: settingsData?.city || '',
        state: settingsData?.state || '',
        establishment_name: settingsData?.establishment_name || 'Barbearia'
    }), [org, settingsData]);

    const fullAddress = useMemo(() => {
        if (!settings.address) return '';
        return `${settings.address}${settings.city ? ` - ${settings.city}` : ''}${settings.state ? `/${settings.state}` : ''}`;
    }, [settings]);

    const handleCancel = (id: string, dateStr: string) => {
        const apptDate = parseISO(dateStr);
        const deadline = addHours(new Date(), 24);

        if (!isAfter(apptDate, deadline)) {
            toast.error("O cancelamento só pode ser feito com 24 horas de antecedência. Entre em contato com a barbearia.");
            return;
        }

        toast("Deseja realmente cancelar este agendamento?", {
            action: {
                label: "Confirmar Cancelamento",
                onClick: async () => {
                    try {
                        await updateStatus({ id, status: AppointmentStatus.CANCELLED });
                        toast.success("Agendamento cancelado com sucesso.");
                    } catch (error) {
                        console.error("Error cancelling:", error);
                        toast.error("Erro ao cancelar.");
                    }
                }
            },
            cancel: {
                label: "Voltar",
            },
            duration: 5000,
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-6" /> {/* Title Skeleton */}
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="flex flex-col md:flex-row gap-4 border-l-4 border-l-gray-700 p-4">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <Skeleton className="h-6 w-3/4" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-8 w-full mt-2" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-8 w-24" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Meus Agendamentos</h2>

            <div className="grid gap-4">
                {appointments.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Calendar size={48} className="mx-auto text-textMuted mb-4 opacity-50" />
                        <p className="text-textMuted">Você ainda não tem agendamentos.</p>
                        <Button className="mt-4" onClick={() => window.location.hash = '#/book'}>Fazer Agendamento</Button>
                    </Card>
                ) : (
                    appointments.map((appt) => {
                        const apptDate = parseISO(appt.date);
                        // Can cancel if pending/confirmed AND > 24h away
                        const canCancel = (appt.status === 'PENDING' || appt.status === 'CONFIRMED') &&
                            isAfter(apptDate, addHours(new Date(), 24));

                        const isFuture = isAfter(apptDate, new Date());

                        // Helper to safely access nested props if types are loose (TanStack Query returns strict types, but check optionality)
                        const serviceName = (appt as any).service?.name || 'Serviço';
                        const serviceDuration = (appt as any).service?.duration_minutes || 0;
                        const servicePrice = (appt as any).service?.price || 0;
                        const barberName = (appt as any).barber?.name || 'Barbeiro';

                        return (
                            <Card key={appt.id} className={`
                            flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 
                            ${appt.status === 'CANCELLED' ? 'border-l-red-500 opacity-60' :
                                    appt.status === 'COMPLETED' ? 'border-l-green-500' :
                                        ''}
                        `}
                                style={appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' ? { borderColor: settings.primary_color } : {}}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`
                                        text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wider
                                        ${appt.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' :
                                                appt.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                                                    appt.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-500' :
                                                        'bg-surfaceHighlight text-white'}
                                     `}
                                            style={appt.status === 'PENDING' ? { color: settings.primary_color, backgroundColor: `${settings.primary_color}1A` } : {}}
                                        >
                                            {appt.status === 'PENDING' && 'Aguardando'}
                                            {appt.status === 'CONFIRMED' && 'Confirmado'}
                                            {appt.status === 'COMPLETED' && 'Concluído'}
                                            {appt.status === 'CANCELLED' && 'Cancelado'}
                                        </span>
                                        <span className="text-textMuted text-xs flex items-center">
                                            <Clock size={12} className="mr-1" />
                                            {serviceDuration} min
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        {format(apptDate, "dd 'de' MMMM", { locale: ptBR })}
                                        <span style={{ color: settings.primary_color }}>às {format(apptDate, "HH:mm")}</span>
                                    </h3>

                                    <div className="flex items-center gap-4 mt-2 text-sm text-textMuted">
                                        <span className="flex items-center gap-1">
                                            <Scissors size={14} /> {serviceName}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <UserIcon size={14} /> {barberName}
                                        </span>
                                    </div>

                                    {/* Location Info */}
                                    {fullAddress && (
                                        <div className="flex items-center gap-2 mt-3 p-2 bg-white/5 rounded-md border border-white/5 text-xs text-textMuted transition-colors">
                                            <MapPin size={14} style={{ color: settings.primary_color }} className="shrink-0" />
                                            <span className="truncate">{fullAddress}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-white font-display font-bold text-lg">
                                        R$ {servicePrice}
                                    </div>
                                    {canCancel && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500"
                                            onClick={() => handleCancel(appt.id, appt.date)}
                                        >
                                            Cancelar
                                        </Button>
                                    )}
                                    {!canCancel && appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && isFuture && (
                                        <p className="text-xs text-textMuted flex items-center gap-1">
                                            <AlertTriangle size={12} />
                                            Cancelamento indisponível (&lt; 24h)
                                        </p>
                                    )}
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};
