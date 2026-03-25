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
  Bell, Smile, Eye, ParkingCircle, Dog, UserCircle, LogOut, ChevronRight as ChevronRightIcon,
  ShoppingBag as StoreIcon, CreditCard as CardIcon
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
import { LoyaltyCard } from './customer/LoyaltyCard';
import { SubscriptionCard } from './customer/SubscriptionCard';

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
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [customerSubscription, setCustomerSubscription] = useState<any>(null);

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
  const { data: rawProductsData, isLoading: isProductsLoading } = useProducts(orgId);
  const productsData = useMemo(() => {
    return (rawProductsData || []).filter(p => p.image_url && p.stock_quantity && p.stock_quantity > 0);
  }, [rawProductsData]);

  // Auth Hook placement
  const { user, isAdmin, role, profile, loading: authLoading } = useAuth();

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

        // Fetch Subscription
        const { data: subData } = await supabase
            .from('customer_subscriptions')
            .select('*, plan:subscription_plans(*)')
            .eq('customer_id', currentUser.id)
            .eq('status', 'active')
            .maybeSingle();
        
        if (subData) {
            setCustomerSubscription(subData);
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

  // The internal LoyaltyProgress and SubscriptionCard components are removed as they are now extracted
  // and the Drawer is disabled for Customers who already have a Sidebar/Hub.

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative" style={brandingStyles}>
      {/* Client Portal Button */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {user ? (
            <button 
                onClick={() => {
                    if (role === Role.CUSTOMER) {
                        navigate('/customer/profile');
                    } else {
                        setIsPortalOpen(true);
                    }
                }}
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg hover:border-primary transition-all relative group"
            >
                {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                    <div className="w-full h-full bg-surfaceHighlight flex items-center justify-center">
                        <UserCircle size={24} className="text-zinc-400 group-hover:text-primary" />
                    </div>
                )}
                {customerSubscription && (
                    <div className="absolute -bottom-1 -right-1 bg-primary w-4 h-4 rounded-full flex items-center justify-center border-2 border-background">
                        <Star size={8} className="text-black fill-current" />
                    </div>
                )}
            </button>
        ) : (
            <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full border-white/10 text-[10px] uppercase font-bold tracking-widest"
                onClick={() => navigate('/login')}
            >
                Entrar
            </Button>
        )}

        {isAdmin && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/admin/dashboard')}>
            <ChevronLeft size={16} />
          </Button>
        )}
      </div>

      {/* Client Portal Drawer - Only for guests or admins, customers use Sidebar */}
      {isPortalOpen && role !== Role.CUSTOMER && (
        <div className="fixed inset-0 z-[60] animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/60 shadow-inner" onClick={() => setIsPortalOpen(false)} />
            <div className="absolute top-0 right-0 h-full w-full max-w-[320px] bg-zinc-900 border-l border-white/5 p-6 animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-lg font-bold text-white tracking-tight">Portal do Cliente</h2>
                    <button onClick={() => setIsPortalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Identification */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20">
                             {profile?.avatar_url ? (
                                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                             ) : (
                                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                    <UserCircle size={32} className="text-zinc-600" />
                                </div>
                             )}
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Olá, reserva feita!</p>
                            <h3 className="text-white font-bold leading-tight line-clamp-1">{profile?.name || 'Cliente'}</h3>
                            {customerSubscription && <span className="text-[10px] text-primary font-black uppercase tracking-tighter">Membro do Clube</span>}
                        </div>
                    </div>

                    {/* Loyalty Visualizer */}
                    <div className="space-y-3">
                         <div className="flex items-center gap-2 px-1">
                            <Gift size={14} className="text-primary" />
                            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Progressão Fidelidade</h3>
                        </div>
                        {loyaltyProfile && (
                            <LoyaltyCard 
                                count={loyaltyProfile.count} 
                                target={loyaltyProfile.target} 
                                enabled={loyaltyProfile.enabled} 
                            />
                        )}
                    </div>

                    {/* Subscription Area */}
                    {customerSubscription && (
                        <div className="space-y-3 pt-2">
                             <div className="flex items-center gap-2 px-1">
                                <Star size={14} className="text-primary" />
                                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Área do Assinante</h3>
                            </div>
                            <SubscriptionCard subscription={customerSubscription} />
                        </div>
                    )}

                    {/* Quick Links */}
                    <div className="pt-4 border-t border-white/5 space-y-2">
                         <button 
                            onClick={() => { navigate('/customer/appointments'); setIsPortalOpen(false); }}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
                        >
                            <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">Meus Agendamentos</span>
                            <ChevronRightIcon size={16} className="text-zinc-600 group-hover:text-primary transition-colors" />
                        </button>
                        <button 
                            onClick={() => { navigate('/customer/profile'); setIsPortalOpen(false); }}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
                        >
                            <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">Editar Perfil</span>
                            <ChevronRightIcon size={16} className="text-zinc-600 group-hover:text-primary transition-colors" />
                        </button>
                    </div>

                    <div className="pt-8">
                        <button 
                            onClick={() => supabase.auth.signOut()}
                            className="w-full flex items-center justify-center gap-2 p-3 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            <LogOut size={14} />
                            Sair da Conta
                        </button>
                    </div>
                </div>
            </div>
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
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-display text-white tracking-tight">Retire na Cadeira 🧴</h2>
                  <p className="text-sm text-zinc-400">Garanta seus produtos favoritos e retire durante o serviço.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(selectedBarber ? BookingStep.BARBER : BookingStep.DATETIME)} className="text-zinc-500">Voltar</Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {productsData?.map(product => {
                  const quantity = selectedProducts[product.id] || 0;
                  const isLowStock = product.stock_quantity && product.stock_quantity < 3;
                  return (
                    <div key={product.id} className="group relative bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col">
                      <div className="aspect-square w-full bg-black relative overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5"><StoreIcon className="text-zinc-700" size={32} /></div>
                        )}
                        {isLowStock && (
                            <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
                                Últimas unidades
                            </div>
                        )}
                        <div className="absolute bottom-3 right-3">
                             <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-black text-amber-400 border border-white/10 shadow-lg">
                                R$ {product.price?.toFixed(2)}
                             </div>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                        <div>
                            <h4 className="font-bold text-white text-sm line-clamp-2 leading-tight">{product.name}</h4>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest line-clamp-1 mt-1">{product.category || 'Cuidados'}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                             <div className="flex items-center bg-zinc-950 rounded-xl border border-white/10 p-1 w-full justify-between">
                                <button
                                    onClick={() => setSelectedProducts(prev => ({ ...prev, [product.id]: Math.max(0, (prev[product.id] || 0) - 1) }))}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-lg font-light"
                                >
                                    -
                                </button>
                                <span className={`text-sm font-bold w-8 text-center ${quantity > 0 ? 'text-amber-400' : 'text-white'}`}>{quantity}</span>
                                <button
                                    onClick={() => setSelectedProducts(prev => ({ ...prev, [product.id]: Math.min(product.stock_quantity || 99, (prev[product.id] || 0) + 1) }))}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-lg font-light"
                                >
                                    +
                                </button>
                             </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

                {productsData && productsData.length > 0 && (
                    <div className="mt-12 flex flex-col items-center gap-4">
                        <Button 
                            onClick={() => setStep(BookingStep.CONFIRM)} 
                            size="lg" 
                            className="px-16 py-7 rounded-2xl shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all font-black uppercase tracking-widest text-xs"
                            style={{ backgroundColor: activeSettings.primary_color || '#D4AF37' }}
                        >
                            Ir para Confirmação
                        </Button>
                        <button 
                            onClick={() => setStep(BookingStep.CONFIRM)} 
                            className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold hover:text-white transition-colors"
                        >
                            Pular, apenas o serviço por enquanto
                        </button>
                    </div>
                )}
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

                {Object.keys(selectedProducts).some(id => selectedProducts[id] > 0) && (
                    <>
                        <div className="pt-2">
                           <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Produtos Adicionados</h4>
                        </div>
                        {Object.entries(selectedProducts).filter(([_, q]) => q > 0).map(([id, quantity]) => {
                          const product = productsData?.find(p => p.id === id);
                          if (!product) return null;
                          return (
                            <div key={id} className="flex justify-between border-b border-white/5 pb-2 text-xs">
                              <div className="flex flex-col">
                                <span className="text-white font-medium">{product.name}</span>
                                <span className="text-[10px] text-amber-400 uppercase tracking-tight">Reserva para retirada</span>
                              </div>
                              <div className="text-right">
                                <span className="text-white font-bold">{quantity}x</span>
                                <p className="text-[10px] text-zinc-500">R$ {(product.price * quantity).toFixed(2)}</p>
                              </div>
                            </div>
                          );
                        })}
                    </>
                )}

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
