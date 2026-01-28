import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { WhatsAppButton } from './ui/WhatsAppButton';
import { Card } from './ui/Card';
import { Check, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, Scissors, User as UserIcon, Loader2 } from 'lucide-react';
import { User, Service, AppointmentStatus, Role } from '../types';
import { db } from '../services/database';
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
  isBefore,
  startOfDay,
  setHours,
  setMinutes,
  addMinutes,
  parse
} from 'date-fns';
import { supabase } from '../services/supabase';
import { useSettings } from '../contexts/SettingsContext';

enum BookingStep {
  SERVICE = 1,
  DATETIME = 2,
  BARBER = 3,
  CONFIRM = 4
}

export const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const [step, setStep] = useState<BookingStep>(BookingStep.SERVICE);
  const [selectedBarber, setSelectedBarber] = useState<User | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Data State
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);

  // Load data from DB
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [servicesData, staffData, appointmentsData] = await Promise.all([
          db.services.list(),
          db.staff.list(),
          db.appointments.list()
        ]);
        setServices(servicesData);
        setStaff(staffData);
        setExistingAppointments(appointmentsData);
      } catch (error) {
        console.error("Failed to load booking data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(BookingStep.DATETIME);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(BookingStep.BARBER);
  };

  const handleBarberSelect = (barber: User) => {
    setSelectedBarber(barber);
    setStep(BookingStep.CONFIRM);
  };

  const handleConfirmBooking = async () => {
    if (selectedBarber && selectedService && selectedTime) {
      // Check for Auth
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Você precisa entrar para agendar.");
        navigate('/login');
        return;
      }

      // Ensure profile exists (fix for missing trigger execution or legacy users)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        console.log("Profile missing for user, creating now...");
        const { error: profileError } = await supabase.from('profiles').insert([{
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Novo Cliente',
          role: Role.CUSTOMER
        }]);

        if (profileError) {
          console.error("Error creating profile fallback", profileError);
          // Verify if it failed because it already exists (race condition)
          if (profileError.code !== '23505') {
            alert("Erro ao verificar seu perfil de usuário. Tente novamente ou contate o suporte.");
            return;
          }
        }
      }

      // Parse time to ISO String
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDate = setMinutes(setHours(selectedDate, hours), minutes);

      try {
        await db.appointments.create({
          id: '', // Supabase/DB will generate UUID
          barberId: selectedBarber.id,
          customerId: user.id, // Use real authenticated user ID
          serviceId: selectedService.id,
          date: appointmentDate.toISOString(),
          status: AppointmentStatus.PENDING
        });
        setShowSuccessModal(true);
      } catch (error: any) {
        console.error("Error creating appointment", error);
        alert(`Erro ao criar agendamento: ${error.message || "Tente novamente."}`);
      }
    }
  };

  const handleFinish = () => {
    setShowSuccessModal(false);
    navigate('/customer/appointments');
  };

  // Calendar Logic
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const handleDateSelect = (day: Date) => {
    if (isBefore(day, startOfDay(new Date()))) return;

    // Check if day is a working day
    const dayOfWeek = day.getDay(); // 0 = Sunday
    const dayConfig = settings.schedule?.find(d => d.dayId === dayOfWeek);

    // Check if day is configured and open
    const isWorkingDay = dayConfig?.isOpen ?? false;

    // If not working day, we can choose to disable selection or just show feedback
    // In this UI implementation, disabled dates in calendar are visually handled by 'isWorkingDay' prop in render
    // but we double check here just in case
    if (!isWorkingDay) {
      // return; 
    }

    setSelectedDate(day);
    setSelectedTime(null);
  };

  // Generate Time Slots based on settings
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    if (!selectedDate || !selectedService) return slots;

    // Get config for the selected day
    const dayOfWeek = selectedDate.getDay();
    const dayConfig = settings.schedule?.find(d => d.dayId === dayOfWeek);

    if (!dayConfig || !dayConfig.isOpen) return slots;

    try {
      let currentTime = parse(dayConfig.openTime, 'HH:mm', selectedDate);
      const endTime = parse(dayConfig.closeTime, 'HH:mm', selectedDate);

      const stepDuration = settings.intervalMinutes || 30;
      const serviceDuration = selectedService.durationMinutes;

      // Break Times
      const breakStart = dayConfig.breakStart ? parse(dayConfig.breakStart, 'HH:mm', selectedDate) : null;
      const breakEnd = dayConfig.breakEnd ? parse(dayConfig.breakEnd, 'HH:mm', selectedDate) : null;

      // Filter appointments for this day
      const dayAppointments = existingAppointments.filter(appt =>
        isSameDay(new Date(appt.date), selectedDate) &&
        appt.status !== AppointmentStatus.CANCELLED
      );

      const now = new Date();
      const isTodayDate = isSameDay(selectedDate, now);

      while (isBefore(currentTime, endTime)) {
        const slotStart = currentTime;
        const slotEnd = addMinutes(slotStart, serviceDuration);

        let isValid = true;

        // 0. Check if slot is in the past (with small buffer)
        if (isTodayDate && isBefore(slotStart, addMinutes(now, 15))) {
          isValid = false;
        }

        // 1. Check if Service fits before Closing
        if (isValid && isBefore(endTime, slotEnd)) {
          // If it doesn't fit, we stop generating for the day
          break;
        }

        // 2. Check overlap with Break
        if (isValid && breakStart && breakEnd) {
          if (isBefore(slotStart, breakEnd) && isBefore(breakStart, slotEnd)) {
            isValid = false;
          }
        }

        // 3. Check overlap with Existing Appointments
        if (isValid) {
          for (const appt of dayAppointments) {
            const apptStart = new Date(appt.date);
            // Use services from state instead of DB call
            const apptService = services.find(s => s.id === appt.serviceId);
            // Default to stepDuration if service not found, just to be safe
            const apptDuration = apptService?.durationMinutes || stepDuration;
            const apptEnd = addMinutes(apptStart, apptDuration);

            // Overlap check
            if (isBefore(slotStart, apptEnd) && isBefore(apptStart, slotEnd)) {
              isValid = false;
              break;
            }
          }
        }

        if (isValid) {
          slots.push(format(currentTime, 'HH:mm'));
        }

        // Increment by fixed interval
        currentTime = addMinutes(currentTime, stepDuration);
      }
    } catch (e) {
      console.error("Error generating time slots", e);
    }
    return slots;
  }, [settings, selectedDate, selectedService, existingAppointments, services]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  // Branding Styles
  const brandingStyles = useMemo(() => ({
    '--primary': settings.primaryColor || '#D4AF37',
    '--secondary': settings.secondaryColor || '#1A1A1A',
  } as React.CSSProperties), [settings]);

  if (isLoading || isSettingsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary w-12 h-12 mb-4" />
        <p className="text-textMuted text-lg animate-pulse">Carregando disponibilidade...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative" style={brandingStyles}>
      {/* Dynamic Background Banner */}
      {settings.bannerUrl && (
        <div className="absolute inset-0 z-0 opacity-20">
          <img src={settings.bannerUrl} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/80 blur-sm"></div>
        </div>
      )}
      <div className="w-full max-w-4xl relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          {settings.logoUrl ? (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-surface shadow-xl">
              <img src={settings.logoUrl} className="w-full h-full object-cover" />
            </div>
          ) : null}
          <h1 className="font-display font-bold text-4xl text-white tracking-widest mb-2">
            {settings.establishmentName || "BARBER"} <span style={{ color: settings.primaryColor }}>{settings.establishmentName ? "" : "PRO"}</span>
          </h1>
          <p className="text-textMuted">Agendamento Online</p>
        </div>

        {/* Progress Bar */}
        {!showSuccessModal && (
          <div className="flex items-center justify-center mb-8 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-16 rounded-full transition-colors duration-300 ${s <= step ? 'bg-primary' : 'bg-surfaceHighlight'}`}
              />
            ))}
          </div>
        )}

        {/* Content Area */}
        <Card className="min-h-[500px] flex flex-col">

          {step === BookingStep.SERVICE && (
            <div className="animate-fade-in flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display text-white">Escolha o Serviço</h2>
              </div>
              <div className="space-y-3">
                {services.map(service => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="cursor-pointer flex items-center justify-between p-4 rounded-xl bg-background border border-border hover:border-primary transition-all hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                  >
                    <div className="flex items-center gap-4">
                      {service.imageUrl && (
                        <img src={service.imageUrl} className="w-16 h-16 rounded-md object-cover" />
                      )}
                      <div>
                        <h3 className="font-bold text-white">{service.name}</h3>
                        <p className="text-sm text-textMuted">{service.description}</p>
                        <p className="text-xs text-primary mt-1 flex items-center">
                          <Clock size={12} className="mr-1" /> {service.durationMinutes} min
                        </p>
                      </div>
                    </div>
                    <span className="font-display font-bold text-xl text-white">R$ {service.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === BookingStep.DATETIME && (
            <div className="animate-fade-in flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display text-white">Data e Hora</h2>
                <button onClick={() => setStep(BookingStep.SERVICE)} className="text-sm text-textMuted hover:text-white">Voltar</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                {/* Calendar Component */}
                <div className="bg-background rounded-lg border border-border p-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white capitalize">{format(currentMonth, 'MMMM yyyy')}</h3>
                    <div className="flex gap-1">
                      <button onClick={prevMonth} className="p-1 hover:bg-surfaceHighlight rounded text-white"><ChevronLeft size={20} /></button>
                      <button onClick={nextMonth} className="p-1 hover:bg-surfaceHighlight rounded text-white"><ChevronRight size={20} /></button>
                    </div>
                  </div>

                  {/* Week Days */}
                  <div className="grid grid-cols-7 mb-2">
                    {weekDays.map(day => (
                      <div key={day} className="text-center text-xs font-medium text-textMuted py-1">{day}</div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      const isSelected = isSameDay(day, selectedDate);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isPast = isBefore(day, startOfDay(new Date()));
                      const isTodayDate = isToday(day);
                      // Check day openness from schedule
                      const dayConfig = settings.schedule?.find(d => d.dayId === day.getDay());
                      const isWorkingDay = dayConfig?.isOpen ?? false;

                      return (
                        <button
                          key={day.toString()}
                          onClick={() => handleDateSelect(day)}
                          disabled={isPast || !isWorkingDay}
                          className={`
                            aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-all
                            ${!isCurrentMonth ? 'text-textMuted/20' : ''}
                            ${(isPast || !isWorkingDay) && isCurrentMonth ? 'text-textMuted/30 cursor-not-allowed decoration-slice' : ''}
                            ${isSelected
                              ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20 scale-105'
                              : isTodayDate && !isPast && !isSelected
                                ? 'border border-primary text-white'
                                : !isPast && isWorkingDay && isCurrentMonth ? 'text-textMuted hover:text-white hover:bg-surfaceHighlight' : ''
                            }
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-textMuted uppercase mb-3 flex items-center">
                    <Clock size={14} className="mr-2" />
                    Horários para {format(selectedDate, 'dd/MM')}
                  </p>

                  <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={`
                          py-3 px-2 rounded-lg border text-sm font-medium transition-all
                          ${selectedTime === time
                            ? 'bg-primary text-black border-primary'
                            : 'bg-surfaceHighlight border-transparent text-white hover:border-primary/50 hover:bg-surfaceHighlight/80'}
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  {!selectedTime && (
                    <div className="mt-auto p-4 rounded-lg bg-surfaceHighlight/30 border border-dashed border-border text-center text-textMuted text-sm">
                      Selecione um horário para continuar
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === BookingStep.BARBER && (
            <div className="animate-fade-in flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display text-white">Escolha o Profissional</h2>
                <button onClick={() => setStep(BookingStep.DATETIME)} className="text-sm text-textMuted hover:text-white">Voltar</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {staff.map(barber => (
                  <div
                    key={barber.id}
                    onClick={() => handleBarberSelect(barber)}
                    className="cursor-pointer group relative p-4 rounded-xl bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                  >
                    <div className="flex items-center gap-4">
                      {barber.avatarUrl && (
                        <img src={barber.avatarUrl} alt={barber.name} className="w-16 h-16 rounded-full object-cover border-2 border-surfaceHighlight group-hover:border-primary" />
                      )}
                      <div>
                        <h3 className="font-bold text-white group-hover:text-primary transition-colors">{barber.name}</h3>
                        <p className="text-sm text-textMuted">{barber.jobTitle}</p>
                      </div>
                      <ChevronRight className="ml-auto text-textMuted group-hover:text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === BookingStep.CONFIRM && selectedBarber && selectedService && selectedTime && (
            <div className="animate-fade-in text-center flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Check className="text-primary" size={32} />
              </div>

              <h2 className="text-2xl font-display font-bold text-white mb-2">Confirmar Agendamento?</h2>
              <p className="text-textMuted mb-8">Revise os detalhes abaixo antes de finalizar.</p>

              <div className="bg-background rounded-xl p-6 border border-border w-full max-w-sm mx-auto mb-8 text-left">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
                  {selectedBarber.avatarUrl && (
                    <img src={selectedBarber.avatarUrl} className="w-10 h-10 rounded-full" />
                  )}
                  <div>
                    <p className="text-sm text-textMuted">Profissional</p>
                    <p className="font-bold text-white">{selectedBarber.name}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-textMuted text-sm">Serviço</span>
                    <span className="text-white font-medium text-sm">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textMuted text-sm">Data/Hora</span>
                    <span className="text-white font-medium text-sm">{format(selectedDate, 'dd/MM/yyyy')} - {selectedTime}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/50">
                    <span className="text-white font-medium">Total</span>
                    <span className="font-bold font-display text-lg" style={{ color: settings.primaryColor }}>R$ {selectedService.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => setStep(BookingStep.BARBER)}>Voltar</Button>
                <Button onClick={handleConfirmBooking}>Confirmar Agendamento</Button>
              </div>
            </div>
          )}

        </Card>
      </div>

      {/* Success Modal Overlay */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface border border-primary/40 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(212,175,55,0.15)] relative transform transition-all scale-100">
            {/* Glow Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 animate-pulse">
                <Check className="text-primary w-12 h-12" />
              </div>

              <h2 className="text-3xl font-display font-bold text-white mb-2 uppercase tracking-wider">Agendado!</h2>
              <p className="text-textMuted mb-8">Seu horário foi reservado com sucesso.</p>

              <div className="w-full bg-background/50 rounded-xl p-6 border border-border mb-8">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
                  <span className="text-textMuted text-sm">Profissional</span>
                  <span className="text-white font-medium">{selectedBarber?.name}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
                  <span className="text-textMuted text-sm">Serviço</span>
                  <span className="text-white font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-textMuted text-sm">Data e Hora</span>
                  <div className="text-right">
                    <span className="block text-white font-medium">{format(selectedDate, 'dd/MM/yyyy')}</span>
                    <span className="block text-primary font-bold">{selectedTime}</span>
                  </div>
                </div>
              </div>

              <Button fullWidth onClick={handleFinish} className="h-12 text-lg shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                Ir para Meus Agendamentos

              </Button>

              {/* WhatsApp Confirmation */}
              {selectedBarber && (
                <WhatsAppButton
                  phone={settings.phone || ''} // Send to Barbershop Owner
                  message={`Olá! Acabei de agendar um horário para dia ${format(selectedDate, 'dd/MM')} às ${selectedTime}. Aguardo confirmação!`}
                  label="Enviar comprovante por WhatsApp"
                  variant="outline"
                  className="w-full justify-center h-12 mt-3"
                />
              )}
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};
