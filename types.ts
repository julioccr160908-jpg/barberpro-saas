
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
  primaryColor?: string;
  secondaryColor?: string;
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
  managed_orgs?: string[];
}

export interface Appointment {
  id: string;
  barberId: string;
  customerId: string;
  serviceId: string;
  date: string; // ISO string
  status: AppointmentStatus;
  organization_id: string;
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
  ownerEmail?: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled' | 'pending';
  planType: 'basic' | 'pro' | 'enterprise';
  createdAt?: string;
  logoUrl?: string;
  bannerUrl?: string;
  whatsappInstanceName?: string;
  whatsappConnected?: boolean;
  mpSubscriptionId?: string;
  mpPayerEmail?: string;
  staffLimit?: number;
  activeStaffCount?: number;
  primaryColor?: string;
  secondaryColor?: string;
  parentOrgId?: string;
}

export interface Expense {
  id: string;
  organizationId: string;
  title: string;
  amount: number;
  date: string;
  category: string;
}

export interface Product {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    price: number;
    stock_quantity: number;
    min_stock_level: number;
    image_url?: string;
    category?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Sale {
    id: string;
    organization_id: string;
    appointment_id?: string;
    customer_id?: string;
    barber_id?: string;
    total_amount: number;
    payment_method?: string;
    status: 'completed' | 'cancelled';
    created_at?: string;
}

export interface SubscriptionPlan {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  price: number;
  interval: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerSubscription {
  id: string;
  customer_id: string;
  plan_id: string;
  organization_id: string;
  status: 'active' | 'cancelled' | 'past_due';
  next_billing_date: string;
  mercado_pago_subscription_id?: string;
  created_at?: string;
  updated_at?: string;
  plan?: SubscriptionPlan;
  customer?: {
    name: string;
    phone?: string;
  };
}

export interface Review {
  id: string;
  organization_id: string;
  appointment_id?: string;
  customer_id?: string;
  barber_id?: string;
  rating: number;
  comment?: string;
  photo_urls: string[];
  is_public: boolean;
  created_at?: string;
}

export interface Sale {
    id: string;
    organization_id: string;
    appointment_id?: string;
    customer_id?: string;
    barber_id?: string;
    total_amount: number;
    payment_method?: string;
    status: 'completed' | 'cancelled';
    created_at?: string;
}

export interface SaleItem {
    id: string;
    sale_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    created_at?: string;
}