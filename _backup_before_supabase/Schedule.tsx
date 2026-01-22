
import React, { useState, useMemo, useEffect } from 'react';
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
  setHours,
  setMinutes
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Scissors, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../services/database';
import { Appointment, Service, User as UserType } from '../types';

interface TimeSlot {
  time: string;
  isAvailable: boolean;
  appointment?: Appointment & { serviceName: string; staffName: string; staffAvatar?: string };
}

export const Schedule: React.FC = () => {
  const { settings } = useSettings();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // Real Data State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<UserType[]>([]);

  // Load Data
  const loadData = () => {
    setAppointments(db.appointments.list());
    setServices(db.services.list());
    setStaff(db.staff.list());
  };

  useEffect(() => {
    loadData();
    // In a real app with websockets, we'd listen for changes.
    // Here we could set an interval or rely on component mount.
  }, []);

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
      const dayAppointments = appointments.filter(a => isSameDay(new Date(a.date), selectedDate));

      while (isBefore(current, close)) {
        const timeStr = format(current, 'HH:mm');

        // Find appointment starting at this time (tolerance of few mins could be added in real app)
        const appt = dayAppointments.find(a => format(new Date(a.date), 'HH:mm') === timeStr);

        let enrichedAppt = undefined;
        if (appt) {
          const service = services.find(s => s.id === appt.serviceId);
          const barber = staff.find(u => u.id === appt.barberId);
          enrichedAppt = {
            ...appt,
            serviceName: service?.name || 'Serviço desconhecido',
            staffName: barber?.name || 'Barbeiro',
            staffAvatar: barber?.avatarUrl
          };
        }

        slots.push({
          time: timeStr,
          isAvailable: !appt,
          appointment: enrichedAppt
        });

        // Increment
        const duration = appt
          ? (services.find(s => s.id === appt.serviceId)?.durationMinutes || settings.intervalMinutes)
          : settings.intervalMinutes;

        current = addMinutes(current, duration);
      }
    } catch (error) {
      console.error("Error generating slots:", error);
      return [];
    }

    return slots;
  }, [settings, selectedDate, appointments, services, staff]);

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
    <div className="h-full flex flex-col">
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
        <Button size="sm" onClick={() => loadData()}>
          Atualizar
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar min-h-0">
        {dailySlots.map((slot, index) => (
          <div key={index} className="flex gap-4">
            {/* Time Column */}
            <div className="w-14 text-right pt-2">
              <span className="text-sm font-medium text-textMuted font-mono">{slot.time}</span>
            </div>

            {/* Event Column */}
            <div className="flex-1">
              {slot.appointment ? (
                <div className="bg-surfaceHighlight border border-primary/20 rounded-xl p-3 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={getStatusBadgeVariant(slot.appointment.status) as any}>
                      {slot.appointment.status}
                    </Badge>
                    <span className="text-xs text-textMuted">{slot.appointment.staffName}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{slot.appointment.customerId === 'guest' ? 'Cliente Externo' : 'Cliente Registrado'}</h4>
                  <div className="flex items-center text-xs text-primary mt-1 font-medium">
                    <Scissors size={12} className="mr-1" />
                    {slot.appointment.serviceName}
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
            <p>Fechado neste dia.</p>
          </div>
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
              {format(currentMonth, 'MMMM yyyy')}
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
        <div className="p-6 h-full w-full flex flex-col overflow-hidden">
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
