
import { Service, User, Role, Appointment, AppointmentStatus, DailyStats } from './types';

export const SEED_SERVICES: Service[] = [
  { 
    id: '1', 
    name: 'Corte Clássico', 
    price: 60, 
    durationMinutes: 45, 
    description: 'Corte tradicional com tesoura e máquina, acabamento na navalha.',
    imageUrl: 'https://images.unsplash.com/photo-1599351431202-6e0000a40aa0?q=80&w=800&auto=format&fit=crop'
  },
  { 
    id: '2', 
    name: 'Barba Terapia', 
    price: 45, 
    durationMinutes: 30, 
    description: 'Modelagem de barba com toalha quente e óleos essenciais.',
    imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop'
  },
  { 
    id: '3', 
    name: 'Combo Completo', 
    price: 90, 
    durationMinutes: 75, 
    description: 'A experiência completa: Corte de cabelo e barba terapia.',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b7f304?q=80&w=800&auto=format&fit=crop'
  },
];

export const SEED_STAFF: User[] = [
  { id: '101', name: 'Carlos "The Blade"', email: 'carlos@barber.com', role: Role.BARBER, avatarUrl: 'https://images.unsplash.com/photo-1580252436402-23b092fb1423?q=80&w=200&auto=format&fit=crop', jobTitle: 'Master Barber' },
  { id: '102', name: 'Mike Santos', email: 'mike@barber.com', role: Role.BARBER, avatarUrl: 'https://images.unsplash.com/photo-1534360406560-593259695629?q=80&w=200&auto=format&fit=crop', jobTitle: 'Barbeiro Sênior' },
];

export const SEED_APPOINTMENTS: Appointment[] = [
  { id: 'a1', barberId: '101', customerId: 'c1', serviceId: '3', date: new Date().toISOString(), status: AppointmentStatus.CONFIRMED },
];

export const MOCK_STATS: DailyStats = {
  revenue: 1450.00,
  appointments: 24,
  occupancyRate: 85,
};

// Revenue data for chart
export const REVENUE_DATA = [
  { name: 'Seg', value: 800 },
  { name: 'Ter', value: 950 },
  { name: 'Qua', value: 1100 },
  { name: 'Qui', value: 1300 },
  { name: 'Sex', value: 2100 },
  { name: 'Sab', value: 2400 },
  { name: 'Dom', value: 1800 },
];
