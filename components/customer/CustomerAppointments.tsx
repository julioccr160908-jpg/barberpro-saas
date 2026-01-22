
import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, Clock, Scissors, AlertTriangle, CheckCircle, XCircle, User as UserIcon, MapPin } from 'lucide-react';
import { db } from '../../services/database';
import { format, isAfter, addHours, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
    id: string;
    date: string;
    status: string;
    service: {
        name: string;
        price: number;
        duration_minutes: number;
    };
    barber: {
        name: string;
    };
}

export const CustomerAppointments: React.FC = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [userAddress, setUserAddress] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchAppointments = async () => {
        try {
            if (!user) return;
            setLoading(true);

            // Parallel fetch: Appointments + Settings
            const [settings, { data: appointmentsData, error }] = await Promise.all([
                db.settings.get(),
                supabase
                    .from('appointments')
                    .select(`
                      id,
                      date,
                      status,
                      service:service_id (name, price, duration_minutes),
                      barber:barber_id (name)
                    `)
                    .eq('customer_id', user.id)
                    .order('date', { ascending: false })
            ]);

            if (settings && settings.address) {
                const fullAddress = `${settings.address}${settings.city ? ` - ${settings.city}` : ''}${settings.state ? `/${settings.state}` : ''}`;
                setAddress(fullAddress);
            }

            if (error) throw error;
            setAppointments(appointmentsData || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user]);

    const handleCancel = async (id: string, dateStr: string) => {
        // Double check 24h rule client side
        const apptDate = parseISO(dateStr);
        const deadline = addHours(new Date(), 24);

        if (!isAfter(apptDate, deadline)) {
            alert("O cancelamento só pode ser feito com 24 horas de antecedência. Entre em contato com a barbearia.");
            return;
        }

        if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'CANCELLED' })
                .eq('id', id);

            if (error) throw error;

            // Update local list
            setAppointments(prev => prev.map(a =>
                a.id === id ? { ...a, status: 'CANCELLED' } : a
            ));
        } catch (error) {
            console.error("Error cancelling:", error);
            alert("Erro ao cancelar.");
        }
    };

    if (loading) return <div className="text-white p-8 text-center">Carregando seus agendamentos...</div>;

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
                        const canCancel = (appt.status === 'PENDING' || appt.status === 'CONFIRMED') &&
                            isAfter(apptDate, addHours(new Date(), 24));

                        const isFuture = isAfter(apptDate, new Date());

                        return (
                            <Card key={appt.id} className={`
                            flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 
                            ${appt.status === 'CANCELLED' ? 'border-l-red-500 opacity-60' :
                                    appt.status === 'COMPLETED' ? 'border-l-green-500' :
                                        'border-l-primary'}
                        `}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`
                                        text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wider
                                        ${appt.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' :
                                                appt.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                                                    appt.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-500' :
                                                        'bg-yellow-500/10 text-yellow-500'}
                                     `}>
                                            {appt.status === 'PENDING' && 'Aguardando'}
                                            {appt.status === 'CONFIRMED' && 'Confirmado'}
                                            {appt.status === 'COMPLETED' && 'Concluído'}
                                            {appt.status === 'CANCELLED' && 'Cancelado'}
                                        </span>
                                        <span className="text-textMuted text-xs flex items-center">
                                            <Clock size={12} className="mr-1" />
                                            {appt.service?.duration_minutes} min
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        {format(apptDate, "dd 'de' MMMM", { locale: ptBR })}
                                        <span className="text-primary">às {format(apptDate, "HH:mm")}</span>
                                    </h3>

                                    <div className="flex items-center gap-4 mt-2 text-sm text-textMuted">
                                        <span className="flex items-center gap-1">
                                            <Scissors size={14} /> {appt.service?.name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <UserIcon size={14} /> {appt.barber?.name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <UserIcon size={14} /> {appt.barber?.name}
                                        </span>
                                    </div>

                                    {/* Location Info */}
                                    {address && (
                                        <div className="flex items-center gap-2 mt-3 p-2 bg-white/5 rounded-md border border-white/5 text-xs text-textMuted group-hover:border-primary/20 transition-colors">
                                            <MapPin size={14} className="text-primary shrink-0" />
                                            <span className="truncate">{address}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-white font-display font-bold text-lg">
                                        R$ {appt.service?.price}
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
