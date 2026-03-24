import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from './ui/Button';
import { WhatsAppButton } from './ui/WhatsAppButton';
import { Card } from './ui/Card';
import { 
  ChevronRight, ChevronLeft, MapPin, Search, Star, Clock, User as UserIcon, Store, Loader2, 
  Wifi, Coffee, Gamepad2, Tv, Snowflake, Beer, Car, Cigarette, GlassWater, Music, 
  PawPrint, Flame, Accessibility, CreditCard, QrCode, Dices, Check, Calendar as CalendarIcon, 
  Scissors, AlertCircle, Gift, Package, X, Dumbbell, Laptop, Utensils, Sofa, Baby, Heart, 
  Camera, HelpCircle, Wine, Pizza, Cookie, Sandwich, IceCream, Martini, MonitorPlay, 
  Trophy, Disc, Radio, Mic, Speaker, Wind, Phone, Tablet, Smartphone, Sparkles, 
  Brush, Shirt, Ruler, ShoppingBag, Tag, Watch, Award, Zap, Shield, Sun, Moon, 
  Bell, Smile, Eye, ParkingCircle, Dog 
} from 'lucide-react';

const AMENITY_ICONS: Record<string, { label: string, icon: any }> = {
  wifi: { label: 'Wi-Fi Grátis', icon: Wifi },
  coffee: { label: 'Café', icon: Coffee },
  beer: { label: 'Cerveja Gelada', icon: Beer },
  water: { label: 'Água / Bebidas', icon: GlassWater },
  ac: { label: 'Ar Condicionado', icon: Snowflake },
  parking: { label: 'Estacionamento', icon: Car },
  tv: { label: 'TV / Esportes', icon: Tv },
  gamepad: { label: 'Videogame', icon: Gamepad2 },
  pool_table: { label: 'Sinuca / Jogos', icon: Dices },
  music: { label: 'Som Ambiente', icon: Music },
  pet_friendly: { label: 'Pet Friendly', icon: PawPrint },
  hot_towel: { label: 'Toalha Quente', icon: Flame },
  accessibility: { label: 'Acessibilidade', icon: Accessibility },
  credit_card: { label: 'Aceita Cartão', icon: CreditCard },
  pix: { label: 'Aceita Pix', icon: QrCode },
  smoking_area: { label: 'Área de Fumantes', icon: Cigarette },
  scissors: { label: 'Corte Premium', icon: Scissors },
  dumbbell: { label: 'Fitness', icon: Dumbbell },
  laptop: { label: 'Espaço Work', icon: Laptop },
  utensils: { label: 'Restaurante', icon: Utensils },
  sofa: { label: 'Lounge', icon: Sofa },
  baby: { label: 'Área Kids', icon: Baby },
  heart: { label: 'Cuidado Especial', icon: Heart },
  star: { label: 'Destaque', icon: Star },
  camera: { label: 'Estúdio', icon: Camera },
  map_pin: { label: 'Localização', icon: MapPin },
};

// Map lowercase icon names to Lucide components for dynamic custom icons
const LUCIDE_ICONS: Record<string, any> = {
  Wifi, Coffee, Beer, GlassWater, Snowflake, Car, Tv, Gamepad2, 
  Dices, Music, PawPrint, Flame, Accessibility, CreditCard, 
  QrCode, Cigarette, Scissors, Dumbbell, Laptop, Utensils, 
  Sofa, Baby, Heart, Star, Camera, MapPin, HelpCircle,
  Wine, Pizza, Cookie, Sandwich, IceCream, Martini, MonitorPlay, 
  Trophy, Disc, Radio, Mic, Speaker, Wind, Phone, Tablet, 
  Smartphone, Sparkles, Brush, Shirt, Ruler, ShoppingBag, 
  Tag, Watch, Award, Zap, Shield, Sun, Moon, Bell, Smile, Eye, 
  ParkingCircle, Dog
};
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
import { Portfolio } from './Portfolio';

import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useProducts } from '../hooks/useProducts';

enum BookingStep {
  SHOWCASE = 0,
  SERVICE = 1,
  DATETIME = 2,
  BARBER = 3,
  UPSELL = 4,
  CONFIRM = 5
}

export const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [step, setStep] = useState<BookingStep>(BookingStep.SHOWCASE);
  const [selectedBarber, setSelectedBarber] = useState<User | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Marketing Hooks
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string, type: 'PERCENTAGE' | 'FIXED', value: number } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState<{ id: string, type?: 'PERCENTAGE' | 'FIXED', value?: number } | null>(null);

  const { slug } = useParams<{ slug: string }>();

  // React Query Hooks
  const { data: org, isLoading: isOrgLoading, isError: isOrgError } = useOrganization(slug);
  const orgId = org?.id;
  const currentOrgId = orgId;

  const { data: servicesData, isLoading: isServicesLoading, isError: isServicesError } = useServices(orgId);
  const { data: staffData, isLoading: isStaffLoading, isError: isStaffError } = useStaff(orgId);
  const { data: appointmentsData, isLoading: isAppointmentsLoading, isError: isAppointmentsError } = useAppointments({ orgId }, !!orgId, false);
  const { data: settingsData, isLoading: isSettingsLoading, isError: isSettingsError } = useSettingsQuery(orgId);
  const { data: productsData, isLoading: isProductsLoading } = useProducts(orgId);

  // Auth Hook placement
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { data: profile } = useProfile(user?.id);

  // Derived State
  const services = servicesData || [];
  const staff = staffData || [];
  const existingAppointments = appointmentsData || [];

  const isLoading = authLoading || isOrgLoading || isServicesLoading || isStaffLoading || isAppointmentsLoading || isSettingsLoading || isProductsLoading;
  const isError = isOrgError || isServicesError || isStaffError || isAppointmentsError || isSettingsError;
  const error = isError ? "Erro ao carregar dados. Verifique a conexão." : null;

  // Persist Slug
  useEffect(() => {
    if (slug && org) {
      localStorage.setItem('barberhost_last_slug', slug);
    }
  }, [slug, org]);

  // Construct Active Settings
  const activeSettings = useMemo(() => {
    const base = settingsData || settings;
    if (!org) return base;

    return {
      ...base,
      primary_color: settingsData?.primary_color || org.primary_color || base.primary_color || '#D4AF37',
      secondary_color: settingsData?.secondary_color || org.secondary_color || base.secondary_color || '#1A1A1A',
      logo_url: settingsData?.logo_url || org.logo_url || base.logo_url || null,
      banner_url: settingsData?.banner_url || org.banner_url || base.banner_url || null,
    };
  }, [settingsData, org, settings]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [logoError, setLogoError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  // Handle URL Query Params for Barber Pre-selection
  useEffect(() => {
    if (!isLoading && staff.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const barberId = searchParams.get('barber');
      const profName = searchParams.get('prof');
      const ref = searchParams.get('ref');

      // Process Affiliate Ref
      if (ref && orgId && !affiliateLink) {
          const validateAffiliate = async () => {
              const { data, error } = await supabase.rpc('get_affiliate_and_increment_click', {
                  p_organization_id: orgId,
                  p_slug_suffix: ref
              });
              if (!error && data && data.valid) {
                  setAffiliateLink({ id: data.id, type: data.discount_type, value: data.discount_value });
              }
          };
          validateAffiliate();
      }

      if (barberId) {
        const barber = staff.find(s => s.id === barberId);
        if (barber) {
          setSelectedBarber(barber);
        }
      } else if (profName) {
        const barber = staff.find(s =>
          s.name && s.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-') === profName
        );
        if (barber) {
          setSelectedBarber(barber);
        }
      }
    }
  }, [isLoading, staff]);

  // Restore pending appointment
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && services.length > 0) {
      const pending = localStorage.getItem('pendingAppointment');
      if (pending) {
        try {
          const { serviceId, barberId } = JSON.parse(pending);
          const service = services.find(s => s.id === serviceId);
          if (service) {
            setSelectedService(service);

            if (barberId && staff.length > 0) {
              const barber = staff.find(s => s.id === barberId);
              if (barber) setSelectedBarber(barber);
            }

            setStep(BookingStep.DATETIME);
            localStorage.removeItem('pendingAppointment');
          }
        } catch (e) {
          console.error("Error parsing pending appointment", e);
          localStorage.removeItem('pendingAppointment');
        }
      }
    }
  }, [isLoading, services, staff]);

  const handleServiceSelect = async (service: Service) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      localStorage.setItem('pendingAppointment', JSON.stringify({
        serviceId: service.id,
        barberId: selectedBarber?.id
      }));
      // Preserve search parameters like ?prof=dono-1
      const returnPath = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/login?redirect=${returnPath}`);
      return;
    }

    setSelectedService(service);
    setStep(BookingStep.DATETIME);
  };

  const searchParamsLocal = new URLSearchParams(window.location.search);
  const isBarberPreselected = searchParamsLocal.has('prof') || searchParamsLocal.has('barber');

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (isBarberPreselected) {
      // If we have products, go to upsell, otherwise confirm
      if (productsData && productsData.length > 0) {
        setStep(BookingStep.UPSELL);
      } else {
        setStep(BookingStep.CONFIRM);
      }
    } else {
      setStep(BookingStep.BARBER);
    }
  };

  const handleBarberSelect = (barber: User) => {
    setSelectedBarber(barber);
    if (productsData && productsData.length > 0) {
      setStep(BookingStep.UPSELL);
    } else {
      setStep(BookingStep.CONFIRM);
    }
  };

  // Loyalty State
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [loyaltyProfile, setLoyaltyProfile] = useState<{ count: number, target: number, enabled: boolean } | null>(null);

  useEffect(() => {
    const checkLoyalty = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const [profileRes, settingsRes] = await Promise.all([
          supabase.from('profiles').select('loyalty_count').eq('id', currentUser.id).maybeSingle(),
          supabase.from('settings').select('loyalty_target, loyalty_enabled').maybeSingle()
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

  const calculateTotal = () => {
      let totals = selectedService?.price || 0;
      Object.entries(selectedProducts).forEach(([id, q]) => {
          const p = productsData?.find(product => product.id === id);
          totals += (p?.price || 0) * q;
      });

      let discount = 0;
      if (affiliateLink?.type && affiliateLink.value) {
          discount += affiliateLink.type === 'PERCENTAGE' ? (totals * affiliateLink.value) / 100 : affiliateLink.value;
      }
      if (appliedCoupon) {
          discount += appliedCoupon.type === 'PERCENTAGE' ? (totals * appliedCoupon.value) / 100 : appliedCoupon.value;
      }

      return Math.max(0, totals - discount);
  };

  const handleApplyCoupon = async () => {
      if (!couponCode.trim() || !orgId) return;
      setIsValidatingCoupon(true);
      try {
          const { data, error } = await supabase.rpc('validate_coupon', { p_organization_id: orgId, p_code: couponCode.trim() });
          if (error || !data || !data.valid) {
              toast.error(data?.message || 'Cupom inválido ou expirado.');
              setAppliedCoupon(null);
          } else {
              setAppliedCoupon({ id: data.id, type: data.discount_type, value: data.discount_value });
              toast.success('Cupom aplicado!');
          }
      } catch (e) {
          toast.error('Erro ao validar.');
      } finally {
          setIsValidatingCoupon(false);
      }
  };

  const handleConfirmBooking = async () => {
    if (selectedBarber && selectedService && selectedTime) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        toast.info("Você precisa entrar para agendar.");
        navigate('/login');
        return;
      }

      const { data: existingProfile } = await supabase.from('profiles').select('role, name').eq('id', currentUser.id).maybeSingle();
      const existingRole = existingProfile?.role || Role.CUSTOMER;
      const existingName = existingProfile?.name || currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Novo Cliente';

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: currentUser.id,
        email: currentUser.email,
        name: existingName,
        role: existingRole,
        organization_id: currentOrgId
      }, { onConflict: 'id', ignoreDuplicates: false });

      if (profileError) {
        console.error("Profile upsert error:", profileError);
      }

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDate = setMinutes(setHours(selectedDate, hours), minutes);

      try {
        const isFree = useLoyalty && loyaltyProfile && loyaltyProfile.count >= loyaltyProfile.target;
        const status = AppointmentStatus.PENDING;

        const { data: newApptData, error: newApptError } = await supabase.from('appointments').insert([{
          organization_id: currentOrgId,
          barber_id: selectedBarber.id,
          customer_id: currentUser.id,
          service_id: selectedService.id,
          date: appointmentDate.toISOString(),
          status: status,
          products: selectedProducts,
          coupon_id: appliedCoupon?.id || null,
          affiliate_id: affiliateLink?.id || null
        }]).select().single();

        if (newApptError) throw newApptError;

        if (isFree) {
          const newCount = loyaltyProfile.count - loyaltyProfile.target;
          await supabase.from('profiles').update({ loyalty_count: newCount }).eq('id', currentUser.id);
        }

        NotificationService.sendById({
          organizationId: currentOrgId || '',
          appointmentId: newApptData.id,
          customerId: currentUser.id,
          type: 'confirmation'
        }).catch(console.error);

        setShowSuccessModal(true);
      } catch (err: any) {
        console.error("Error creating appointment", err);
        toast.error(`Erro ao criar agendamento: ${err.message || "Tente novamente."}`);
      }
    }
  };

  const [whatsappMessage, setWhatsappMessage] = useState('');

  useEffect(() => {
    const prepareWhatsappMessage = async () => {
      if (!showSuccessModal || !selectedBarber || !selectedService || !selectedDate || !selectedTime) return;

      let message = `Olá! Acabei de agendar um horário para dia ${format(selectedDate, 'dd/MM')} às ${selectedTime}. Aguardo confirmação!`;

      try {
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
            customer_name: 'Cliente',
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
    setSelectedDate(day);
    setSelectedTime(null);
  };

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    if (!selectedDate || !selectedService) return slots;

    const dayOfWeek = selectedDate.getDay();
    const schedule = (activeSettings.schedule as any[]) || [];
    const dayConfig = schedule.find(d => d.dayId === dayOfWeek);

    if (!dayConfig || !dayConfig.isOpen) return slots;

    try {
      let currentTime = parse(dayConfig.openTime, 'HH:mm', selectedDate);
      const endTime = parse(dayConfig.closeTime, 'HH:mm', selectedDate);

      const stepDuration = activeSettings.interval_minutes || 30;
      const serviceDuration = selectedService.durationMinutes;

      const breakStart = dayConfig.breakStart ? parse(dayConfig.breakStart, 'HH:mm', selectedDate) : null;
      const breakEnd = dayConfig.breakEnd ? parse(dayConfig.breakEnd, 'HH:mm', selectedDate) : null;

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

        if (isTodayDate && isBefore(slotStart, addMinutes(now, 15))) {
          isValid = false;
        }

        if (isValid && isBefore(endTime, slotEnd)) {
          break;
        }

        if (isValid && breakStart && breakEnd) {
          if (isBefore(slotStart, breakEnd) && isBefore(breakStart, slotEnd)) {
            isValid = false;
          }
        }

        if (isValid) {
          for (const appt of dayAppointments) {
            const apptStart = new Date(appt.date);
            const apptService = services.find(s => s.id === appt.serviceId);
            const apptDuration = apptService?.durationMinutes || stepDuration;
            const apptEnd = addMinutes(apptStart, apptDuration);

            if (isBefore(slotStart, apptEnd) && isBefore(apptStart, slotEnd)) {
              isValid = false;
              break;
            }
          }
        }

        if (isValid) {
          slots.push(format(currentTime, 'HH:mm'));
        }

        currentTime = addMinutes(currentTime, stepDuration);
      }
    } catch (e) {
      console.error("Error generating time slots", e);
    }
    return slots;
  }, [activeSettings, selectedDate, selectedService, existingAppointments, services]);

  const brandingStyles = useMemo(() => ({
    '--primary': activeSettings.primary_color || '#D4AF37',
    '--secondary': activeSettings.secondary_color || '#1A1A1A',
    '--color-primary': activeSettings.primary_color || '#D4AF37',
    '--color-secondary': activeSettings.secondary_color || '#1A1A1A',
  } as React.CSSProperties), [activeSettings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" style={brandingStyles}>
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!isLoading && slug && !org) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white p-4">
        <Store size={64} className="text-textMuted mb-4" />
        <h2 className="text-2xl font-bold mb-2">Barbearia não encontrada</h2>
        <Button variant="outline" onClick={() => navigate('/')}>Voltar ao Início</Button>
      </div>
    );
  }

  // Only show the back button if they are really an admin
  // isAdmin from useAuth is safer as it's global

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative" style={brandingStyles}>
      {isAdmin && (
        <div className="absolute top-4 right-4 z-50">
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <ChevronLeft size={16} className="mr-2" /> Voltar ao Painel
          </Button>
        </div>
      )}

      {activeSettings.banner_url && !bannerError && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={activeSettings.banner_url} 
            className="w-full h-full object-cover transition-opacity duration-500" 
            alt="Banner" 
            style={{ opacity: (activeSettings.banner_opacity ?? 20) / 100 }}
            onError={() => setBannerError(true)} 
          />
          <div className="absolute inset-0 bg-background/80 blur-sm"></div>
        </div>
      )}

      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-8">
          {activeSettings.logo_url && !logoError && (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-surface shadow-xl">
              <img src={activeSettings.logo_url} className="w-full h-full object-cover" alt="Logo" onError={() => setLogoError(true)} />
            </div>
          )}
          <h1 className="font-display font-bold text-4xl text-white tracking-widest mb-2">
            {activeSettings.establishment_name}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-textMuted opacity-80">
            <MapPin size={14} style={{ color: activeSettings.primary_color }} />
            <p>{activeSettings.address} {activeSettings.city && ` - ${activeSettings.city}`}</p>
          </div>
        </div>

        {!showSuccessModal && step !== BookingStep.SHOWCASE && (
          <div className="flex items-center justify-center mb-8 gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                style={{ backgroundColor: s <= step ? activeSettings.primary_color : undefined }}
                className={`h-1.5 w-16 rounded-full transition-colors duration-300 ${s <= step ? '' : 'bg-surfaceHighlight'}`}
              />
            ))}
          </div>
        )}

        <Card className="min-h-[500px] flex flex-col p-6">
          {step === BookingStep.SHOWCASE && (
            <div className="animate-fade-in flex-1 space-y-8 flex flex-col items-center justify-center text-center">
              {selectedBarber ? (
                <>
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-primary/20 overflow-hidden mx-auto mb-2">
                    {selectedBarber.avatarUrl ? (
                      <img src={selectedBarber.avatarUrl} alt={selectedBarber.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <UserIcon size={40} className="text-textMuted" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-3xl font-display text-white">Agende com {selectedBarber.name?.split(' ')[0]}</h2>
                  <p className="text-textMuted max-w-md">Selecione o serviço abaixo para garantir o seu horário exclusivo.</p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-display text-white">Pronto para o seu melhor visual?</h2>
                  <p className="text-textMuted max-w-md">Agende agora seu horário com nossos profissionais qualificados.</p>
                </>
              )}

              <Button
                onClick={() => setStep(BookingStep.SERVICE)}
                size="lg"
                className="px-12 py-6 text-xl mt-4"
                style={{ backgroundColor: activeSettings.primary_color || '#D4AF37' }}
              >
                Agendar Agora
              </Button>

              {/* Amenities Section */}
              {((activeSettings.amenities && activeSettings.amenities.length > 0) || (activeSettings.custom_amenities && (activeSettings.custom_amenities as any[]).length > 0)) && (
                <div className="w-full mt-8 pt-8 border-t border-white/5">
                  <h3 className="text-sm font-medium text-textMuted uppercase tracking-wider mb-6">Comodidades</h3>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {/* Standard Amenities */}
                    {activeSettings.amenities?.map(amenityId => {
                      const amenity = AMENITY_ICONS[amenityId as keyof typeof AMENITY_ICONS];
                      if (!amenity) return null;
                      const Icon = amenity.icon;
                      return (
                        <div key={amenityId} className="flex flex-col items-center gap-2 text-zinc-400 bg-white/5 px-4 py-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <Icon size={20} className="text-white/80" />
                          <span className="text-xs font-medium">{amenity.label}</span>
                        </div>
                      );
                    })}
                    
                    {/* Custom Amenities */}
                    {(activeSettings.custom_amenities as any[])?.map((amenity: any) => {
                      if (!activeSettings.amenities?.includes(amenity.id)) return null;
                      const Icon = LUCIDE_ICONS[amenity.icon] || HelpCircle;
                      return (
                        <div key={amenity.id} className="flex flex-col items-center gap-2 text-zinc-400 bg-white/5 px-4 py-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <Icon size={20} className="text-white/80" />
                          <span className="text-xs font-medium">{amenity.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Portfolio Section */}
              {currentOrgId && !selectedBarber && (
                <div className="w-full mt-12 border-t border-white/5 pt-12">
                  <Portfolio organizationId={currentOrgId} />
                </div>
              )}
            </div>
          )}

          {step === BookingStep.SERVICE && (
            <div className="animate-fade-in flex-1">
              <h2 className="text-xl font-display text-white mb-6">Escolha o Serviço</h2>
              <div className="space-y-3">
                {services.map(service => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="cursor-pointer group flex items-center justify-between p-4 rounded-xl bg-background border border-white/10 hover:border-primary transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {service.imageUrl && <img src={service.imageUrl} className="w-16 h-16 rounded-md object-cover" alt={service.name} />}
                      <div>
                        <h3 className="font-bold text-white group-hover:text-primary">{service.name}</h3>
                        <p className="text-xs text-textMuted flex items-center gap-1">
                          <Clock size={12} /> {service.durationMinutes} min
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
            <div className="animate-fade-in flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display text-white">Data e Hora</h2>
                <Button variant="ghost" size="sm" onClick={() => setStep(BookingStep.SERVICE)}>Voltar</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-surface p-4 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft size={16} /></Button>
                      <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight size={16} /></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="text-[10px] text-textMuted font-bold">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map(day => {
                      const isPast = isBefore(day, startOfDay(new Date()));
                      const isSelected = isSameDay(day, selectedDate);
                      return (
                        <button
                          key={day.toString()}
                          onClick={() => handleDateSelect(day)}
                          disabled={isPast}
                          className={`aspect-square rounded-lg text-xs font-medium transition-all ${isSelected ? 'bg-primary text-black font-bold' : isPast ? 'text-white/10 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={`w-full py-3 rounded-lg border transition-all ${selectedTime === time ? 'text-black font-bold' : 'bg-white/5 border-transparent text-white hover:bg-white/10'}`}
                      style={selectedTime === time ? {
                        backgroundColor: activeSettings.primary_color || '#D4AF37',
                        borderColor: activeSettings.primary_color || '#D4AF37'
                      } : {}}
                    >
                      {time}
                    </button>
                  ))}
                  {timeSlots.length === 0 && <div className="text-center py-8 text-textMuted">Nenhum horário disponível.</div>}
                </div>
              </div>
            </div>
          )}

          {step === BookingStep.UPSELL && (
            <div className="animate-fade-in flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-display text-white">Adicionar algo mais?</h2>
                  <p className="text-sm text-textMuted">Aproveite para garantir seus produtos favoritos.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(selectedBarber ? BookingStep.BARBER : BookingStep.DATETIME)}>Voltar</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productsData?.map(product => {
                  const quantity = selectedProducts[product.id] || 0;
                  return (
                    <div key={product.id} className="p-4 rounded-xl border border-white/10 bg-background flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-surfaceHighlight flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="text-textMuted" size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-sm">{product.name}</h4>
                        <p className="text-xs text-textMuted mb-2">R$ {product.price}</p>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedProducts(prev => ({ ...prev, [product.id]: Math.max(0, (prev[product.id] || 0) - 1) }))}
                            className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10"
                          >
                            -
                          </button>
                          <span className="text-sm text-white font-bold w-4 text-center">{quantity}</span>
                          <button
                            onClick={() => setSelectedProducts(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }))}
                            className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center">
                <Button onClick={() => setStep(BookingStep.CONFIRM)} size="lg" className="px-12">
                  Próximo <ChevronRight size={18} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === BookingStep.CONFIRM && selectedBarber && selectedService && selectedTime && (
            <div className="animate-fade-in flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
              <h2 className="text-xl font-display text-white mb-6 text-center">Tudo certo?</h2>
              <div className="bg-white/5 rounded-2xl p-6 space-y-4 mb-8">
                <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-textMuted text-sm">Serviço</span><span className="text-white font-bold">{selectedService.name}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-textMuted text-sm">Profissional</span><span className="text-white font-bold">{selectedBarber.name}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-textMuted text-sm">Data</span><span className="text-white font-bold">{format(selectedDate, 'dd/MM/yyyy')}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-textMuted text-sm">Horário</span><span className="font-bold" style={{ color: activeSettings.primary_color || '#D4AF37' }}>{selectedTime}</span></div>

                {Object.entries(selectedProducts).filter(([_, q]) => q > 0).map(([id, quantity]) => {
                  const product = productsData?.find(p => p.id === id);
                  if (!product) return null;
                  return (
                    <div key={id} className="flex justify-between border-b border-white/5 pb-2 text-xs">
                      <span className="text-textMuted">{quantity}x {product.name}</span>
                      <span className="text-white">R$ {(product.price * quantity).toFixed(2)}</span>
                    </div>
                  );
                })}

                {affiliateLink?.type && affiliateLink.value && (
                  <div className="flex justify-between border-b border-white/5 pb-2 text-emerald-400 text-xs font-bold">
                    <span>Desconto de Indicação</span>
                    <span>- {affiliateLink.type === 'PERCENTAGE' ? `${affiliateLink.value}%` : `R$ ${affiliateLink.value}`}</span>
                  </div>
                )}

                {!appliedCoupon ? (
                  <div className="py-2 border-b border-white/5 mb-2">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Cupom de desconto" 
                            value={couponCode} 
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            className="flex-1 bg-black/40 border border-zinc-800 rounded-lg px-3 text-white text-sm uppercase"
                        />
                        <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={!couponCode || isValidatingCoupon}>
                            {isValidatingCoupon ? <Loader2 size={16} className="animate-spin" /> : 'Aplicar'}
                        </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between border-b border-white/5 pb-2 text-yellow-500 text-xs font-bold items-center">
                    <span className="flex items-center gap-2">
                        Cupom Aplicado ({couponCode})
                        <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-zinc-500 hover:text-red-500"><X size={12} /></button>
                    </span>
                    <span>- {appliedCoupon.type === 'PERCENTAGE' ? `${appliedCoupon.value}%` : `R$ ${appliedCoupon.value}`}</span>
                  </div>
                )}

                <div className="pt-4 flex justify-between items-center">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-2xl font-display font-bold" style={{ color: activeSettings.primary_color || '#D4AF37' }}>
                    R$ {calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <Button fullWidth onClick={handleConfirmBooking} size="lg" style={{ backgroundColor: activeSettings.primary_color || '#D4AF37' }}>Confirmar Agendamento</Button>
                <Button fullWidth variant="ghost" onClick={() => setStep(productsData && productsData.length > 0 ? BookingStep.UPSELL : (isBarberPreselected ? BookingStep.DATETIME : BookingStep.BARBER))}>
                  Voltar e Alterar
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface p-10 rounded-3xl max-w-sm w-full text-center border shadow-2xl relative overflow-hidden" style={{ borderColor: (activeSettings.primary_color || '#D4AF37') + '33' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
            <div className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: (activeSettings.primary_color || '#D4AF37') + '1a' }}>
              <Check style={{ color: activeSettings.primary_color || '#D4AF37' }} className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4 relative z-10">Agendado!</h2>
            <p className="text-textMuted mb-8 relative z-10">Seu horário foi reservado. Nos vemos em breve!</p>
            <div className="space-y-3 relative z-10">
              <Button fullWidth onClick={handleFinish} style={{ backgroundColor: activeSettings.primary_color || '#D4AF37' }}>Meus Agendamentos</Button>
              {selectedBarber && (
                <WhatsAppButton
                  phone={settings.phone || ''}
                  message={whatsappMessage}
                  label="Enviar Comprovante"
                  variant="outline"
                  className="w-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
