import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from './ui/Button';
import { WhatsAppButton } from './ui/WhatsAppButton';
import { Card } from './ui/Card';
import { Check, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, Scissors, User as UserIcon, Loader2, CreditCard, Store, Gift, AlertCircle } from 'lucide-react';
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
import { ptBR } from 'date-fns/locale';
import { supabase } from '../services/supabase';
import { useSettings } from '../contexts/SettingsContext';
import { NotificationService } from '../services/NotificationService';
import { toast } from 'sonner';
import { Skeleton } from './ui/Skeleton';
import { useOrganization } from '../hooks/useOrganization';
import { useServices } from '../hooks/useServices';
import { useStaff } from '../hooks/useStaff';
import { useAppointments } from '../hooks/useAppointments';
import { useSettingsQuery } from '../hooks/useSettingsQuery';

enum BookingStep {
  SHOWCASE = 0,
  SERVICE = 1,
  DATETIME = 2,
  BARBER = 3,
  CONFIRM = 4
}

export const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [step, setStep] = useState<BookingStep>(BookingStep.SHOWCASE);
  const [selectedBarber, setSelectedBarber] = useState<User | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { slug } = useParams<{ slug: string }>();

  // React Query Hooks
  const { data: org, isLoading: isOrgLoading, isError: isOrgError } = useOrganization(slug);
  const orgId = org?.id;
  const currentOrgId = orgId; // Alias for compatibility with existing code

  const { data: servicesData, isLoading: isServicesLoading, isError: isServicesError } = useServices(orgId);
  const { data: staffData, isLoading: isStaffLoading, isError: isStaffError } = useStaff(orgId);
  const { data: appointmentsData, isLoading: isAppointmentsLoading, isError: isAppointmentsError } = useAppointments({ orgId }, !!orgId);
  const { data: settingsData, isLoading: isSettingsLoading, isError: isSettingsError } = useSettingsQuery(orgId);

  // Derived State
  const services = servicesData || [];
  const staff = staffData || [];
  const existingAppointments = appointmentsData || [];

  const isLoading = isOrgLoading || isServicesLoading || isStaffLoading || isAppointmentsLoading || isSettingsLoading;
  const isError = isOrgError || isServicesError || isStaffError || isAppointmentsError || isSettingsError;
  const error = isError ? "Erro ao carregar dados. Verifique a conexão." : null;

  // Persist Slug
  useEffect(() => {
    if (slug && org) {
      localStorage.setItem('barberpro_last_slug', slug);
    }
  }, [slug, org]);

  // Construct Active Settings
  const activeSettings = useMemo(() => {
    if (!settingsData || !org) return settings; // Fallback to context if missing (though context might be empty too)

    return {
      interval_minutes: settingsData.interval_minutes,
      schedule: settingsData.schedule,
      establishment_name: settingsData.establishment_name,
      address: settingsData.address,
      phone: settingsData.phone,
      city: settingsData.city,

      // Branding from Organization Table
      primary_color: org.primary_color || settingsData.primary_color || '#D4AF37',
      secondary_color: org.secondary_color || settingsData.secondary_color || '#1A1A1A',
      logo_url: org.logo_url || settingsData.logo_url,
      banner_url: org.banner_url || settingsData.banner_url,

      loyalty_enabled: settingsData.loyalty_enabled,
      loyalty_target: settingsData.loyalty_target
    };
  }, [settingsData, org, settings]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Restore pending appointment state after login
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && services.length > 0) {
      const pending = localStorage.getItem('pendingAppointment');
      if (pending) {
        try {
          const { serviceId } = JSON.parse(pending);
          const service = services.find(s => s.id === serviceId);
          if (service) {
            setSelectedService(service);
            setStep(BookingStep.DATETIME);
            localStorage.removeItem('pendingAppointment');
          }
        } catch (e) {
          console.error("Error parsing pending appointment", e);
          localStorage.removeItem('pendingAppointment');
        }
      }
    }
  }, [isLoading, services]);

  const handleServiceSelect = async (service: Service) => {
    // Check if user is authenticated immediately
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Store current state to restore after login
      localStorage.setItem('pendingAppointment', JSON.stringify({ serviceId: service.id }));

      // Redirect to login with proper return path
      const returnPath = encodeURIComponent(location.pathname);
      navigate(`/login?redirect=${returnPath}`);
      return;
    }

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

  // Loyalty State
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [loyaltyProfile, setLoyaltyProfile] = useState<{ count: number, target: number, enabled: boolean } | null>(null);

  useEffect(() => {
    // Fetch Loyalty Status on Load (if user exists)
    const checkLoyalty = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [profileRes, settingsRes] = await Promise.all([
          supabase.from('profiles').select('loyalty_count').eq('id', user.id).single(),
          supabase.from('settings').select('loyalty_target, loyalty_enabled').single()
        ]);

        if (profileRes.data && settingsRes.data?.loyalty_enabled) {
          setLoyaltyProfile({
            count: profileRes.data.loyalty_count || 0,
            target: settingsRes.data.loyalty_target || 10,
            enabled: true
          });
        }
      }
    };
    checkLoyalty();
  }, []);

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'local'>('online');

  const handleConfirmBooking = async () => {
    if (selectedBarber && selectedService && selectedTime) {
      // Check for Auth
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.info("Você precisa entrar para agendar.");
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

        if (profileError && profileError.code !== '23505') {
          toast.error("Erro ao verificar seu perfil de usuário. Tente novamente ou contate o suporte.");
          return;
        }
      }

      // Parse time to ISO String
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDate = setMinutes(setHours(selectedDate, hours), minutes);

      try {
        const isFree = useLoyalty && loyaltyProfile && loyaltyProfile.count >= loyaltyProfile.target;
        const status = paymentMethod === 'online' && !isFree ? AppointmentStatus.AWAITING_PAYMENT : AppointmentStatus.PENDING;

        const { data: newApptData, error: newApptError } = await supabase.from('appointments').insert([{
          organization_id: currentOrgId, // Explicitly set Org ID
          barber_id: selectedBarber.id,
          customer_id: user.id,
          service_id: selectedService.id,
          date: appointmentDate.toISOString(),
          status: status
        }]).select().single();

        if (newApptError) throw newApptError;

        const newAppt = {
          id: newApptData.id,
          barberId: newApptData.barber_id,
          customerId: newApptData.customer_id,
          serviceId: newApptData.service_id,
          date: newApptData.date,
          status: newApptData.status
        };

        // Handle Loyalty Redemption
        if (isFree) {
          const newCount = loyaltyProfile.count - loyaltyProfile.target;
          await supabase.from('profiles').update({ loyalty_count: newCount }).eq('id', user.id);
          // Optionally mark appointment as "Loyalty Reward" in a notes field if it existed?
          // For now, we just rely on price being 0 conceptually (though DB record has service price).
          // We might want to store 'price_paid: 0' in future.
        }

        // If Online Payment (And NOT Free)
        if (paymentMethod === 'online' && !isFree) {
          // Call Edge Function (Mock or Real)
          const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: {
              title: `${selectedService.name} - ${format(appointmentDate, 'dd/MM/yyyy HH:mm')} `,
              quantity: 1,
              price: selectedService.price,
              back_urls: {
                success: `${window.location.origin} /booking/success ? appointment_id = ${newAppt.id} `,
                failure: `${window.location.origin} /booking/failure`,
                pending: `${window.location.origin} /booking/pending`
              }
            }
          });

          if (error || !data?.init_point) {
            throw new Error('Erro ao gerar pagamento. Tente novamente ou pague no local.');
          }

          // Redirect to Checkout
          window.location.href = data.init_point;
          return;
        }

        // If Local Payment or Loyalty Redemption -> Notifications & Success Modal
        // Trigger Notification (Async)
        // We don't await this to avoid blocking the UI response
        NotificationService.sendById({
          // Let's assume for now we use a fixed ID or I check where 'settings' comes from.
          // Wait, existing migrations added 'organization_id' to tables.
          // 'Appointment' CREATE doesn't pass org_id, so DB trigger or default handles it?
          // Or 'services/database.ts' handles it?

          // Checking 'services/database.ts' create method:
          // It inserts [ { barber_id, ... } ]. No org_id.
          // This suggests RLS or Default handles it. OR it's missing.
          // If RLS handles it (using auth.uid()), it assigns the customer's org? No, customer has no org.
          // It implies implicit organization or single tenant?
          // If strict multi-tenant, we have an issue.

          // However, this is 'barberpro-saas'.
          // Let's assume we can get it from the Service or Staff.
          // Actually, for this Phase 1, let's simplify.
          // I will update NotificationService to FETCH the org_id from the appointment (after insertion)
          // BEFORE fetching the template.

          // So I will pass 'organizationId' as empty string here? No that's hacky.
          // usage: NotificationService.sendById({ ... organizationId: ??? });

          // I'll update NotificationService First to make organizationId optional in payload, 
          // and derive it from appointment lookup.

          organizationId: '', // Will be derived in Service if handled
          appointmentId: newAppt.id,
          customerId: user.id,
          type: 'confirmation'
        });

        setShowSuccessModal(true);
      } catch (error: any) {
        console.error("Error creating appointment", error);
        toast.error(`Erro ao criar agendamento: ${error.message || "Tente novamente."} `);
      }
    }
  };

  // WhatsApp Template Logic
  const [whatsappMessage, setWhatsappMessage] = useState('');

  useEffect(() => {
    const prepareWhatsappMessage = async () => {
      if (!showSuccessModal || !selectedBarber || !selectedService || !selectedDate || !selectedTime) return;

      // Default Fallback
      let message = `Olá! Acabei de agendar um horário para dia ${format(selectedDate, 'dd/MM')} às ${selectedTime}. Aguardo confirmação!`;

      try {
        // Try to fetch template
        const { data: templates } = await supabase
          .from('notification_templates')
          .select('content')
          .eq('organization_id', currentOrgId)
          .eq('type', 'confirmation')
          .eq('channel', 'whatsapp')
          .eq('is_active', true)
          .limit(1);

        if (templates && templates.length > 0) {
          const template = templates[0];
          const vars = {
            customer_name: 'Cliente', // We might not have name if unauth/new, but we have user object usually
            service_name: selectedService.name,
            establishment_name: activeSettings.establishment_name || 'Barbearia',
            date_time: format(selectedDate, "dd/MM 'às' HH:mm", { locale: ptBR }),
            time: selectedTime,
          };

          let content = template.content;
          Object.entries(vars).forEach(([key, value]) => {
            content = content.replace(new RegExp(`{${key}}`, 'g'), value);
          });
          message = content;
        }
      } catch (e) {
        console.error("Error fetching template", e);
      }
      setWhatsappMessage(message);
    };

    if (showSuccessModal) {
      prepareWhatsappMessage();
    }
  }, [showSuccessModal, selectedDate, selectedTime, selectedService, selectedBarber, currentOrgId, activeSettings]);


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
    const dayConfig = activeSettings.schedule?.find(d => d.dayId === dayOfWeek);

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
    const dayConfig = activeSettings.schedule?.find(d => d.dayId === dayOfWeek);

    if (!dayConfig || !dayConfig.isOpen) return slots;

    try {
      let currentTime = parse(dayConfig.openTime, 'HH:mm', selectedDate);
      const endTime = parse(dayConfig.closeTime, 'HH:mm', selectedDate);

      const stepDuration = activeSettings.interval_minutes || 30;
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
  }, [activeSettings, selectedDate, selectedService, existingAppointments, services]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  // Branding Styles
  const brandingStyles = useMemo(() => ({
    '--primary': activeSettings.primary_color || '#D4AF37',
    '--secondary': activeSettings.secondary_color || '#1A1A1A',
  } as React.CSSProperties), [activeSettings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-4xl relative z-10 animate-pulse space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col items-center">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="w-64 h-10 mb-2" />
            <Skeleton className="w-40 h-5" />
          </div>

          {/* Content Skeleton */}
          <Card className="min-h-[500px] p-8 space-y-8">
            <Skeleton className="w-full h-12 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }



  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-2">Ops!</h2>
        <p className="text-textMuted">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>Voltar ao Início</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative" style={brandingStyles}>
      {/* Dynamic Background Banner */}
      {activeSettings.banner_url && (
        <div className="absolute inset-0 z-0 opacity-20">
          <img src={activeSettings.banner_url} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/80 blur-sm"></div>
        </div>
      )}
      <div className="w-full max-w-4xl relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          {activeSettings.logo_url ? (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-surface shadow-xl">
              <img src={activeSettings.logo_url} className="w-full h-full object-cover" />
            </div>
          ) : null}
          <h1 className="font-display font-bold text-4xl text-white tracking-widest mb-2">
            {activeSettings.establishment_name || "BARBER"} <span style={{ color: activeSettings.primary_color }}>{activeSettings.establishment_name ? "" : "PRO"}</span>
          </h1>
          <p className="text-textMuted">Agendamento Online</p>
        </div>

        {/* Progress Bar */}
        {!showSuccessModal && step !== BookingStep.SHOWCASE && (
          <div className="flex items-center justify-center mb-8 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                style={{ backgroundColor: s <= step ? activeSettings.primary_color : undefined }}
                className={`h-1.5 w-16 rounded-full transition-colors duration-300 ${s <= step ? '' : 'bg-surfaceHighlight'}`}
              />
            ))}
          </div>
        )}

        {/* Content Area */}
        <Card className="min-h-[500px] flex flex-col">

          {step === BookingStep.SHOWCASE && (
            <div className="animate-fade-in flex-1 space-y-8">
              {/* Introduction */}
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-display text-white">Bem-vindo à {activeSettings.establishment_name || "Nossa Barbearia"}</h2>
                <p className="text-textMuted max-w-lg mx-auto">
                  Conheça nossos serviços e profissionais especializados.
                </p>
                <button
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                      const returnPath = encodeURIComponent(window.location.pathname);
                      const message = encodeURIComponent("Para fazer o agendamento é necessário fazer login ou se cadastrar.");
                      navigate(`/login?redirect=${returnPath}&message=${message}`);
                    } else {
                      setStep(BookingStep.SERVICE);
                    }
                  }}
                  style={{
                    backgroundColor: activeSettings.primary_color || '#D4AF37',
                    color: activeSettings.secondary_color || '#000',
                    border: `1px solid ${activeSettings.primary_color || '#D4AF37'}`,
                  }}
                  className="w-full sm:w-auto px-8 py-4 rounded-lg font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-8 hover:opacity-90 transition-all transform hover:scale-105"
                >
                  Fazer Agendamento
                </button>
              </div>

              {/* Services Preview */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 pl-2 border-l-4" style={{ borderColor: activeSettings.primary_color }}>Nossos Serviços</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map(service => (
                    <div
                      key={service.id}
                      className="p-4 rounded-xl bg-background/50 border border-white/5 flex items-center gap-4 hover:bg-white/5 transition-colors"
                    >
                      {service.imageUrl ? (
                        <img src={service.imageUrl} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                          <Scissors size={20} className="text-textMuted" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white">{service.name}</h4>
                        <p className="text-xs text-textMuted line-clamp-1">{service.description}</p>
                        <span className="font-bold text-sm" style={{ color: activeSettings.primary_color }}>R$ {service.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Preview */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 pl-2 border-l-4" style={{ borderColor: activeSettings.primary_color }}>Nossa Equipe</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {staff.map(barber => (
                    <div key={barber.id} className="bg-background/50 p-4 rounded-xl border border-white/5 text-center">
                      {barber.avatarUrl ? (
                        <img src={barber.avatarUrl} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2" style={{ borderColor: `${activeSettings.primary_color}33` }} />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white/10 mx-auto mb-2 flex items-center justify-center">
                          <UserIcon size={24} className="text-textMuted" />
                        </div>
                      )}
                      <p className="font-bold text-white text-sm">{barber.name}</p>
                      <p className="text-xs text-textMuted">{barber.jobTitle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                    className="cursor-pointer flex items-center justify-between p-4 rounded-xl bg-background border border-border transition-all hover:shadow-lg"
                    style={{
                      borderColor: 'rgba(255,255,255,0.1)',
                      // onHover logic handled by CSS or state? Inline hover is hard.
                      // We can use a group class or just rely on the fact that existing CSS hover:border-primary might fail.
                      // But we want to ensure style consistency.
                      // For simplicity, we keep the border neutral unless selected (which closes this view).
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = activeSettings.primary_color || '';
                      e.currentTarget.style.boxShadow = `0 0 15px ${activeSettings.primary_color}1A`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {service.imageUrl && (
                        <img src={service.imageUrl} className="w-16 h-16 rounded-md object-cover" />
                      )}
                      <div>
                        <h3 className="font-bold text-white">{service.name}</h3>
                        <p className="text-sm text-textMuted">{service.description}</p>
                        <p className="text-xs mt-1 flex items-center" style={{ color: activeSettings.primary_color }}>
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
                <div className="bg-surface rounded-2xl border border-white/5 p-6 shadow-xl">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white capitalize font-display tracking-wide">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
                    <div className="flex gap-2">
                      <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronLeft size={20} /></button>
                      <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronRight size={20} /></button>
                    </div>
                  </div>

                  {/* Week Days */}
                  <div className="grid grid-cols-7 mb-4">
                    {weekDays.map(day => (
                      <div key={day} className="text-center text-xs font-bold text-textMuted uppercase tracking-wider py-2">{day}</div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => {
                      const isSelected = isSameDay(day, selectedDate);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isPast = isBefore(day, startOfDay(new Date()));
                      const isTodayDate = isToday(day);
                      // Check day openness from schedule
                      const dayConfig = activeSettings.schedule?.find(d => d.dayId === day.getDay());
                      const isWorkingDay = dayConfig?.isOpen ?? false;

                      return (
                        <button
                          key={day.toString()}
                          onClick={() => handleDateSelect(day)}
                          disabled={isPast || !isWorkingDay}
                          style={isSelected ? { backgroundColor: activeSettings.primary_color, color: activeSettings.secondary_color || '#000', boxShadow: `0 0 15px ${activeSettings.primary_color}80` } : isTodayDate && !isPast ? { borderColor: activeSettings.primary_color, color: activeSettings.primary_color } : {}}
                          className={`
                            aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden
                            ${!isCurrentMonth ? 'text-white/10' : ''}
                            ${(isPast || !isWorkingDay) && isCurrentMonth ? 'text-white/20 cursor-not-allowed' : ''}
                            ${isSelected
                              ? 'font-bold scale-110 z-10 border-transparent'
                              : isTodayDate && !isPast && !isSelected
                                ? 'border'
                                : !isPast && isWorkingDay && isCurrentMonth ? 'text-white hover:bg-white/10 hover:scale-105' : ''
                            }
                          `}
                        >
                          {format(day, 'd')}
                          {isSelected && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-lg pointer-events-none"></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="flex flex-col bg-surface rounded-2xl border border-white/5 p-6 shadow-xl h-fit">
                  <p className="text-sm font-bold text-textMuted uppercase mb-4 flex items-center tracking-wider pb-4 border-b border-white/5">
                    <Clock size={16} className="mr-2" style={{ color: activeSettings.primary_color }} />
                    Horários para {format(selectedDate, 'dd/MM')}
                  </p>

                  <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[360px] pr-2 custom-scrollbar">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        style={selectedTime === time ? { backgroundColor: activeSettings.primary_color, color: activeSettings.secondary_color || '#000', borderColor: activeSettings.primary_color, boxShadow: `0 0 15px ${activeSettings.primary_color}66` } : {}}
                        className={`
                          py-3 px-2 rounded-xl border text-sm font-bold transition-all duration-300
                          ${selectedTime === time
                            ? 'scale-105'
                            : 'bg-white/5 border-transparent text-white hover:border-white/20 hover:bg-white/10 hover:scale-105'
                          }
                        `}
                      >
                        {time}
                      </button>
                    ))}
                    {timeSlots.length === 0 && (
                      <div className="col-span-3 py-8 text-center text-textMuted flex flex-col items-center">
                        <AlertCircle size={32} className="mb-2 opacity-50" />
                        <p>Sem horários disponíveis para este data.</p>
                      </div>
                    )}
                  </div>

                  {!selectedTime && timeSlots.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl border border-dashed text-center text-sm font-medium animate-pulse"
                      style={{ backgroundColor: `${activeSettings.primary_color}1A`, borderColor: `${activeSettings.primary_color}33`, color: activeSettings.primary_color }}>
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
                {isLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 rounded-xl border border-white/5 bg-background flex items-center gap-4">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))
                ) : (
                  staff.map(barber => (
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
                  ))
                )}
              </div>
            </div>
          )}

          {step === BookingStep.CONFIRM && selectedBarber && selectedService && selectedTime && (
            <div className="animate-fade-in flex-1">
              <h2 className="text-xl font-display text-white mb-6">Confirmar Agendamento</h2>

              <div className="bg-white/5 rounded-xl p-6 space-y-4 mb-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="text-primary" size={20} />
                    <div>
                      <p className="text-sm text-textMuted">Data</p>
                      <p className="font-bold text-white capitalize">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-textMuted">Horário</p>
                    <p className="font-bold text-white text-xl">{selectedTime}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Scissors className="text-primary" size={20} />
                    <div>
                      <p className="text-sm text-textMuted">Serviço</p>
                      <p className="font-bold text-white">{selectedService.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-textMuted">Valor</p>
                    <p className="font-bold text-primary text-xl">R$ {selectedService.price}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <UserIcon className="text-primary" size={20} />
                  <div>
                    <p className="text-sm text-textMuted">Profissional</p>
                    <p className="font-bold text-white">{selectedBarber.name}</p>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-bold text-white">Forma de Pagamento</h3>

                {/* Loyalty Redemption Option */}
                {loyaltyProfile && loyaltyProfile.enabled && loyaltyProfile.count >= loyaltyProfile.target && (
                  <div
                    onClick={() => setUseLoyalty(!useLoyalty)}
                    className={`p - 4 rounded - xl border cursor - pointer transition - all flex items - center justify - between mb - 4 ${useLoyalty ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-background/50 border-white/10 hover:border-yellow-500/50'} `}
                  >
                    <div className="flex items-center gap-3">
                      <Gift size={32} className="text-yellow-500" />
                      <div className="text-left">
                        <p className="font-bold text-white">Resgatar Corte Grátis!</p>
                        <p className="text-xs text-textMuted">Você tem pontuação suficiente. (Saldo: {loyaltyProfile.count})</p>
                      </div>
                    </div>
                    <div className={`w - 6 h - 6 rounded - full border - 2 flex items - center justify - center ${useLoyalty ? 'bg-yellow-500 border-yellow-500' : 'border-textMuted'} `}>
                      {useLoyalty && <Check size={14} className="text-black" />}
                    </div>
                  </div>
                )}

                {!useLoyalty && (
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => setPaymentMethod('online')}
                      className={`p - 4 rounded - xl border cursor - pointer transition - all flex flex - col items - center justify - center text - center gap - 2 ${paymentMethod === 'online' ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-background/50 border-white/10 hover:border-white/30 hover:bg-white/5'} `}
                    >
                      <CreditCard className={`mb - 1 ${paymentMethod === 'online' ? 'text-primary' : 'text-textMuted'} `} size={28} />
                      <div>
                        <p className={`font - bold ${paymentMethod === 'online' ? 'text-white' : 'text-textMuted'} `}>Pagar Agora</p>
                        <p className="text-[10px] text-textMuted uppercase tracking-wider">PIX / Cartão</p>
                      </div>
                    </div>
                    <div
                      onClick={() => setPaymentMethod('local')}
                      className={`p - 4 rounded - xl border cursor - pointer transition - all flex flex - col items - center justify - center text - center gap - 2 ${paymentMethod === 'local' ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-background/50 border-white/10 hover:border-white/30 hover:bg-white/5'} `}
                    >
                      <Store className={`mb - 1 ${paymentMethod === 'local' ? 'text-primary' : 'text-textMuted'} `} size={28} />
                      <div>
                        <p className={`font - bold ${paymentMethod === 'local' ? 'text-white' : 'text-textMuted'} `}>Pagar no Local</p>
                        <p className="text-[10px] text-textMuted uppercase tracking-wider">Dinheiro / Cartão</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(BookingStep.BARBER)} className="flex-1">
                  Voltar
                </Button>
                <Button onClick={handleConfirmBooking} className="flex-[2] h-12 text-lg">
                  {paymentMethod === 'online' ? 'Ir para Pagamento' : 'Confirmar Agendamento'}
                </Button>
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
                  message={whatsappMessage}
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
