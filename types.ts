
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
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
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
  commissionRate?: number;
  loyaltyCount?: number;
  organization_id?: string;
}

export interface Appointment {
  id: string;
  barberId: string;
  customerId: string;
  serviceId: string;
  date: string; // ISO string
  status: AppointmentStatus;
  service?: {
    name: string;
    price: number;
    durationMinutes: number;
  };
  barber?: {
    name: string;
  };
  customer?: {
    name: string;
    phone?: string;
    avatarUrl?: string;
  };
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

import { Database } from './database.types';

export type ShopSettings = Database['public']['Tables']['settings']['Row'];

// Stats for dashboard
export interface DailyStats {
  revenue: number;
  appointments: number;
  occupancyRate: number;
  commissionRate?: number;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
  planType: 'basic' | 'pro' | 'enterprise';
  createdAt?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface Expense {
  id: string;
  organizationId: string;
  title: string;
  amount: number;
  date: string;
  category: string;
}