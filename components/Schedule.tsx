
import React, { useState, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMinutes,
  isBefore,
  parse,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2, Scissors } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { Button } from './ui/Button';
import { WhatsAppButton } from './ui/WhatsAppButton';
import { toast } from 'sonner';
import { NotificationService } from '../services/NotificationService';
import { useSettings } from '../contexts/SettingsContext';
import { Appointment, AppointmentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useAppointments } from '../hooks/useAppointments';
import { ptBR } from 'date-fns/locale';

interface TimeSlot {
  time: string;
  isAvailable: boolean;
  appointment?: Appointment & {
    serviceName: string;
    staffName: string;
    staffAvatar?: string;
    customerName?: string;
    customerPhone?: string;
  };
}

export const Schedule: React.FC = () => {
  const { settings } = useSettings();
  const { user, isBarber, profile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // Fetch Appointments using Query Hook
  const { data: appointments = [], isLoading, updateStatus, createAppointment } = useAppointments({
    orgId: profile?.organization_id
  });

  // Calendar Navigation
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const jumpToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Calendar Grid Logic
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Generate Slots merged with Appointments
  const dailySlots: TimeSlot[] = useMemo(() => {
    const slots: TimeSlot[] = [];

    // Find config for selected day
    const dayOfWeek = selectedDate.getDay();
    const dayConfig = settings.schedule?.find(d => d.dayId === dayOfWeek);

    // If no config or closed, return empty
    if (!dayConfig || !dayConfig.isOpen) {
      return [];
    }

    try {
      const open = parse(dayConfig.openTime, 'HH:mm', selectedDate);
      const close = parse(dayConfig.closeTime, 'HH:mm', selectedDate);
      let current = open;

      // Filter appointments for the selected day
      const dayAppointments = appointments.filter(a => {
        const isDay = isSameDay(new Date(a.date), selectedDate);
        if (!isDay) return false;
        if (isBarber && user) {
          return a.barberId === user.id;
        }
        return true;
      });

      while (isBefore(current, close)) {
        const timeStr = format(current, 'HH:mm');

        // Find appointment starting at this time
        const appt = dayAppointments.find(a => format(new Date(a.date), 'HH:mm') === timeStr);

        let enrichedAppt = undefined;
        if (appt) {
          enrichedAppt = {
            ...appt,
            serviceName: appt.service?.name || 'Serviço excluído',
            staffName: appt.barber?.name || 'Barbeiro',
            staffAvatar: undefined, // barber avatar not fetched yet, could add if critical
            customerName: appt.customer?.name || (appt.customerId === 'guest' ? 'Cliente Externo' : 'Cliente'),
            customerPhone: appt.customer?.phone
          };
        }

        slots.push({
          time: timeStr,
          isAvailable: !appt,
          appointment: enrichedAppt
        });

        // Increment
        const duration = appt
          ? (appt.service?.durationMinutes || settings.intervalMinutes)
          : settings.intervalMinutes;

        current = addMinutes(current, duration);
      }
    } catch (error) {
      console.error("Error generating slots:", error);
      return [];
    }

    return slots;
  }, [settings, selectedDate, appointments, isBarber, user]);

  // Indicator logic
  const hasAppointments = (day: Date) => {
    return appointments.some(appt => isSameDay(new Date(appt.date), day));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'CANCELLED': return 'destructive';
      case 'COMPLETED': return 'default';
      default: return 'warning';
    }
  };

  const AppointmentList = () => (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-white uppercase">
            {isToday(selectedDate) ? 'Hoje' : format(selectedDate, 'dd/MM')}
          </h2>
          <p className="text-sm text-textMuted">
            {(() => {
              const dayConfig = settings.schedule?.find(d => d.dayId === selectedDate.getDay());
              if (!dayConfig || !dayConfig.isOpen) return 'Fechado';
              return `Horário: ${dayConfig.openTime} - ${dayConfig.closeTime}`;
            })()}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar min-h-0">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-14 pt-2">
                  <Skeleton className="h-4 w-10" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {dailySlots.map((slot, index) => (
              <div key={index} className="flex gap-4">
                {/* Time Column */}
                <div className="w-14 text-right pt-2">
                  <span className="text-sm font-medium text-textMuted font-mono">{slot.time}</span>
                </div>

                {/* Event Column */}
                <div className="flex-1">
                  {slot.appointment ? (
                    <div className="bg-surfaceHighlight border border-primary/20 rounded-xl p-3 shadow-sm hover:border-primary/50 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={getStatusBadgeVariant(slot.appointment.status) as any}>
                          {slot.appointment.status}
                        </Badge>
                        <span className="text-xs text-textMuted">{slot.appointment.staffName}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">{slot.appointment.customerName}</h4>
                      <div className="flex items-center text-xs text-primary mt-1 font-medium">
                        <Scissors size={12} className="mr-1" />
                        {slot.appointment.serviceName}
                      </div>

                      {/* WhatsApp Action */}
                      {slot.appointment.customerPhone && (
                        <div className="mt-2">
                          <WhatsAppButton
                            phone={slot.appointment.customerPhone}
                            message={`Olá ${slot.appointment.customerName}, confirmando seu agendamento para ${format(selectedDate, 'dd/MM')} às ${slot.appointment.serviceName} na BarberHost. Tudo certo?`}
                            label="Enviar Msg"
                            size="sm"
                            variant="ghost"
                            className="w-full justify-start h-8 text-xs px-0 text-green-400 hover:text-green-300 hover:bg-transparent"
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-3 pt-3 border-t border-border/50 flex gap-2">
                        {slot.appointment.status === 'PENDING' && (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  await updateStatus({ id: slot.appointment!.id, status: AppointmentStatus.CONFIRMED });
                                  toast.success('Agendamento confirmado!');
                                  // Dispatch WhatsApp notification (async, non-blocking)
                                  NotificationService.sendById({
                                    appointmentId: slot.appointment!.id,
                                    customerId: slot.appointment!.customerId,
                                    type: 'confirmation'
                                  });
                                } catch (error) {
                                  toast.error('Erro ao confirmar');
                                }
                              }}
                              className="flex-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1"
                            >
                              <CheckCircle size={14} />
                              Confirmar
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Cancelar este agendamento?')) {
                                  try {
                                    await updateStatus({ id: slot.appointment!.id, status: AppointmentStatus.CANCELLED });
                                    toast.success('Agendamento cancelado');
                                    // Dispatch WhatsApp cancellation notification
                                    NotificationService.sendById({
                                      appointmentId: slot.appointment!.id,
                                      customerId: slot.appointment!.customerId,
                                      type: 'cancelled'
                                    });
                                  } catch (error) {
                                    toast.error('Erro ao cancelar');
                                  }
                                }
                              }}
                              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {slot.appointment.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  await updateStatus({ id: slot.appointment!.id, status: AppointmentStatus.COMPLETED });
                                  toast.success('Corte marcado como realizado!');
                                } catch (error) {
                                  toast.error('Erro ao atualizar');
                                }
                              }}
                              className="flex-1 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary text-primary text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1"
                            >
                              <CheckCircle size={14} />
                              Marcar como Realizado
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Cancelar este agendamento?')) {
                                  try {
                                    await updateStatus({ id: slot.appointment!.id, status: AppointmentStatus.CANCELLED });
                                    toast.success('Agendamento cancelado');
                                    // Dispatch WhatsApp cancellation notification
                                    NotificationService.sendById({
                                      appointmentId: slot.appointment!.id,
                                      customerId: slot.appointment!.customerId,
                                      type: 'cancelled'
                                    });
                                  } catch (error) {
                                    toast.error('Erro ao cancelar');
                                  }
                                }
                              }}
                              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {slot.appointment.status === 'COMPLETED' && (
                          <div className="flex-1 text-center text-xs text-green-400 flex items-center justify-center gap-1">
                            <CheckCircle size={14} />
                            Corte Realizado
                          </div>
                        )}
                        {slot.appointment.status === 'CANCELLED' && (
                          <div className="flex-1 text-center text-xs text-red-400 flex items-center justify-center gap-1">
                            <XCircle size={14} />
                            Cancelado
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-10 border-l-2 border-dashed border-border ml-2 pl-4 flex items-center">
                      <span className="text-xs text-textMuted/30">Disponível</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {dailySlots.length === 0 && (
              <div className="text-center py-10 text-textMuted">
                <p>Fechado neste dia ou sem horários configurados.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 animate-fade-in relative">

      {/* LEFT COLUMN: CALENDAR */}
      <Card className="flex-[2] flex flex-col h-full bg-surface border-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-display font-bold text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-surfaceHighlight rounded-lg p-1">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-md text-white transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={jumpToToday} className="px-3 py-1 text-xs font-bold text-primary hover:bg-white/10 rounded-md transition-colors uppercase">
              Hoje
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-md text-white transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-textMuted uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 lg:gap-2 flex-1 auto-rows-fr">
          {calendarDays.map((day, dayIdx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const hasAppt = hasAppointments(day);

            return (
              <button
                key={day.toString()}
                onClick={() => {
                  setSelectedDate(day);
                  setIsMobileSheetOpen(true);
                }}
                className={`
                  relative flex flex-col items-center justify-start py-2 lg:py-3 rounded-lg transition-all duration-200 border
                  ${!isCurrentMonth ? 'text-textMuted/30 bg-transparent border-transparent' : ''}
                  ${isSelected
                    ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(212,175,55,0.4)] z-10 scale-105'
                    : isTodayDate
                      ? 'bg-surfaceHighlight border-primary/50 text-white'
                      : 'bg-surfaceHighlight/30 border-transparent text-textMuted hover:bg-surfaceHighlight hover:text-white'}
                `}
              >
                <span className={`text-sm lg:text-base font-bold ${isSelected ? 'text-black' : ''}`}>
                  {format(day, 'd')}
                </span>

                {hasAppt && (
                  <div className={`mt-1 lg:mt-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-primary'}`} />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* RIGHT COLUMN: APPOINTMENT LIST (DESKTOP) */}
      <Card noPadding className="hidden lg:flex flex-1 h-full bg-surface border-border flex-col">
        <div className="p-6 flex-1 w-full flex flex-col min-h-0">
          <AppointmentList />
        </div>
      </Card>

      {/* MOBILE SHEET / DRAWER */}
      {isMobileSheetOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileSheetOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-surface border-t border-border rounded-t-2xl p-6 h-[60vh] lg:hidden animate-slide-up shadow-2xl">
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6 opacity-50" />
            <AppointmentList />
          </div>
        </>
      )}
    </div>
  );
};
