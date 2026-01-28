
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  BARBER = 'BARBER',
  CUSTOMER = 'CUSTOMER',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  jobTitle?: string;
  phone?: string;
}

export interface Appointment {
  id: string;
  barberId: string;
  customerId: string;
  serviceId: string;
  date: string; // ISO string
  status: AppointmentStatus;
}

export interface Barbershop {
  id: string;
  name: string;
  address: string;
}

export interface DayConfig {
  dayId: number; // 0 (Sun) - 6 (Sat)
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface ShopSettings {
  intervalMinutes: number;
  schedule: DayConfig[];
  establishmentName?: string;
  address?: string;
  phone?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Branding
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  bannerUrl?: string;
  themeMode?: 'light' | 'dark';
}

// Stats for dashboard
export interface DailyStats {
  revenue: number;
  appointments: number;
  occupancyRate: number;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
  planType: 'basic' | 'pro' | 'enterprise';
  createdAt?: string;
}