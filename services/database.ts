
import { Service, User, Appointment, ShopSettings, AppointmentStatus } from '../types';
import { SEED_SERVICES, SEED_STAFF, SEED_APPOINTMENTS } from '../constants';

const DB_KEY = 'barberhost_db_v1';

interface DatabaseSchema {
  services: Service[];
  staff: User[];
  appointments: Appointment[];
  settings: ShopSettings;
}

const DEFAULT_SCHEDULE = [
  { dayId: 0, isOpen: false, openTime: "09:00", closeTime: "18:00" }, // Dom
  { dayId: 1, isOpen: true, openTime: "09:00", closeTime: "19:00", breakStart: "12:00", breakEnd: "13:00" }, // Seg
  { dayId: 2, isOpen: true, openTime: "09:00", closeTime: "19:00", breakStart: "12:00", breakEnd: "13:00" }, // Ter
  { dayId: 3, isOpen: true, openTime: "09:00", closeTime: "19:00", breakStart: "12:00", breakEnd: "13:00" }, // Qua
  { dayId: 4, isOpen: true, openTime: "09:00", closeTime: "19:00", breakStart: "12:00", breakEnd: "13:00" }, // Qui
  { dayId: 5, isOpen: true, openTime: "09:00", closeTime: "19:00", breakStart: "12:00", breakEnd: "13:00" }, // Sex
  { dayId: 6, isOpen: true, openTime: "09:00", closeTime: "17:00" }, // Sab
];

const DEFAULT_SETTINGS: ShopSettings = {
  id: 0,
  interval_minutes: 45,
  schedule: DEFAULT_SCHEDULE as any,
  organization_id: null,
  establishment_name: null,
  address: null,
  phone: null,
  city: null,
  state: null,
  zip_code: null,
  primary_color: null,
  secondary_color: null,
  loyalty_enabled: false,
  loyalty_target: null
};


import { supabase } from './supabase';

export const db = {
  // Initialize DB (No longer needed for Supabase as it persists remotely, but kept for compatibility if needed)
  init: async () => { },

  // Helper to ensure data isolation
  _getOrgId: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Check if user has organization_id in profile (for barbers/staff)
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (profile?.organization_id) return profile.organization_id;

    // 2. Check if user is owner of an organization
    const { data: ownedOrg } = await supabase.from('organizations').select('id').eq('owner_id', user.id).limit(1).single();
    if (ownedOrg?.id) return ownedOrg.id;

    return null;
  },


  // --- SERVICES ---
  services: {
    list: async (): Promise<Service[]> => {
      const orgId = await db._getOrgId();
      if (!orgId) return []; // Fail-closed

      const { data, error } = await supabase.from('services').select('*').eq('organization_id', orgId);

      if (error) throw error;
      return data.map(s => ({
        ...s,
        durationMinutes: s.duration_minutes,
        imageUrl: s.image_url
      }));
    },
    create: async (service: Service) => {
      const orgId = await db._getOrgId();
      if (!orgId) throw new Error("Organization ID required");

      const { data, error } = await supabase.from('services').insert([{
        organization_id: orgId,
        name: service.name,
        price: service.price,
        duration_minutes: service.durationMinutes,
        description: service.description,
        image_url: service.imageUrl
      }]).select().single();

      if (error) throw error;
      return {
        ...data,
        durationMinutes: data.duration_minutes,
        imageUrl: data.image_url
      };
    },
    update: async (updated: Service) => {
      const { error } = await supabase.from('services').update({
        name: updated.name,
        price: updated.price,
        duration_minutes: updated.durationMinutes,
        description: updated.description,
        image_url: updated.imageUrl
      }).eq('id', updated.id);

      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // --- CUSTOMERS ---
  customers: {
    list: async (): Promise<User[]> => {
      const orgId = await db._getOrgId();
      if (!orgId) return [];

      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'CUSTOMER').eq('organization_id', orgId);

      if (error) throw error;
      return data.map(u => ({
        ...u,
        avatarUrl: u.avatar_url,
        jobTitle: u.job_title
      }));
    },
    getById: async (id: string) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error) return undefined;
      return { ...data, avatarUrl: data.avatar_url, jobTitle: data.job_title };
    }
  },

  // --- STAFF ---
  staff: {
    list: async (): Promise<User[]> => {
      const orgId = await db._getOrgId();
      if (!orgId) return [];

      const { data, error } = await supabase.from('profiles').select('*').in('role', ['BARBER', 'ADMIN']).eq('organization_id', orgId);

      if (error) throw error;
      return data.map(u => ({
        ...u,
        avatarUrl: u.avatar_url,
        jobTitle: u.job_title,
        commissionRate: u.commission_rate
      }));
    },
    create: async (user: User) => {
      // Note: In Supabase, users are usually created via Auth. 
      // This might just create the profile record if needed manually.
      const { data, error } = await supabase.from('profiles').insert([{
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatarUrl,
        job_title: user.jobTitle,
        commission_rate: user.commissionRate || 0
      }]).select().single();

      if (error) throw error;
      return { ...data, avatarUrl: data.avatar_url, jobTitle: data.job_title, commissionRate: data.commission_rate };
    },
    update: async (updated: User) => {
      const { error } = await supabase.from('profiles').update({
        name: updated.name,
        email: updated.email,
        role: updated.role,
        avatar_url: updated.avatarUrl,
        job_title: updated.jobTitle,
        commission_rate: updated.commissionRate
      }).eq('id', updated.id);

      if (error) throw error;
    },
    delete: async (id: string) => {
      // IMPORTANTE: Em produção, use Edge Function para manter segurança
      // Por enquanto, deletamos apenas do profiles (Auth deletion requer service_role key)

      // Primeiro, tenta deletar appointments relacionados
      await supabase.from('appointments').delete().eq('barber_id', id);
      await supabase.from('appointments').delete().eq('customer_id', id);

      // Depois deleta o profile
      const { error } = await supabase.from('profiles').delete().eq('id', id);

      if (error) {
        console.error("Erro ao excluir perfil:", error);
        throw new Error(`Não foi possível excluir o usuário: ${error.message}`);
      }

      // NOTA: O usuário ainda existirá no Auth. Para deletar completamente,
      // use: npx supabase db execute "SELECT auth.delete_user('[USER_ID]');"
    },
    getById: async (id: string) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error) return undefined;
      return { ...data, avatarUrl: data.avatar_url, jobTitle: data.job_title };
    }
  },

  // --- APPOINTMENTS ---
  appointments: {
    list: async (filters?: { customerId?: string; barberId?: string }): Promise<Appointment[]> => {
      const orgId = await db._getOrgId();

      // If we have an orgId (Staff/Admin), use it contextually.
      // If we don't (Customer), relying on filters.customerId is valid (RLS will protect).
      // If neither, we can't look up anything safely.
      if (!orgId && !filters?.customerId) return [];

      let query = supabase.from('appointments').select(`
        *,
        service:service_id (name, price, duration_minutes),
        barber:barber_id (name),
        customer:customer_id (name, phone, avatar_url)
      `);

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);
      if (filters?.barberId) query = query.eq('barber_id', filters.barberId);

      const { data, error } = await query;

      if (error) throw error;
      return data.map(a => ({
        id: a.id,
        barberId: a.barber_id,
        customerId: a.customer_id,
        serviceId: a.service_id,
        date: a.date,
        status: a.status,
        service: a.service ? {
          name: a.service.name,
          price: a.service.price,
          durationMinutes: a.service.duration_minutes
        } : undefined,
        barber: a.barber ? {
          name: a.barber.name
        } : undefined,
        customer: a.customer ? {
          name: a.customer.name,
          phone: a.customer.phone,
          avatarUrl: a.customer.avatar_url
        } : undefined
      }));
    },
    create: async (appt: Appointment) => {
      const orgId = await db._getOrgId();
      // orgId can be null? appointments might not strictly require it if barber_id has it, but better to be explicit 
      // Actually appointments SHOULD link to org.

      const { data, error } = await supabase.from('appointments').insert([{
        organization_id: orgId,
        barber_id: appt.barberId,
        customer_id: appt.customerId,
        service_id: appt.serviceId,
        date: appt.date,
        status: appt.status
      }]).select().single();

      if (error) throw error;
      return {
        id: data.id,
        barberId: data.barber_id,
        customerId: data.customer_id,
        serviceId: data.service_id,
        date: data.date,
        status: data.status
      };
    },
    updateStatus: async (id: string, status: AppointmentStatus) => {
      let updateData: any = { status };

      // Calculate commission if completing
      if (status === 'COMPLETED') {
        // 1. Get Appointment Details
        const { data: appt } = await supabase.from('appointments').select('service_id, barber_id, customer_id').eq('id', id).single();

        if (appt) {
          // 2. Get Service Price & Barber Commission Rate
          const { data: service } = await supabase.from('services').select('price').eq('id', appt.service_id).single();
          const { data: barber } = await supabase.from('profiles').select('commission_rate').eq('id', appt.barber_id).single();

          if (service && barber) {
            const price = service.price || 0;
            const rate = barber.commission_rate || 0;
            const commission = (price * rate) / 100;

            updateData.commission_amount = commission;
          }

          // Loyalty Program Logic
          const { data: settings } = await supabase.from('settings').select('loyalty_enabled').single();
          if (settings?.loyalty_enabled) {
            const { data: customer } = await supabase.from('profiles').select('loyalty_count').eq('id', appt.customer_id).single();
            const currentCount = customer?.loyalty_count || 0;
            await supabase.from('profiles').update({ loyalty_count: currentCount + 1 }).eq('id', appt.customer_id);
          }
        }
      }

      const { error } = await supabase.from('appointments').update(updateData).eq('id', id);
      if (error) throw error;
    }
  },

  // --- SETTINGS ---
  settings: {
    get: async (): Promise<ShopSettings> => {
      const orgId = await db._getOrgId();
      if (!orgId) return DEFAULT_SETTINGS;

      // Fetch Settings and Organization Slug in parallel
      const [settingsRes, orgRes] = await Promise.all([
        supabase.from('settings').select('*').eq('organization_id', orgId).maybeSingle(),
        supabase.from('organizations').select('slug').eq('id', orgId).single()
      ]);

      if (settingsRes.error) throw settingsRes.error;
      const data = settingsRes.data;
      if (!data) return DEFAULT_SETTINGS;

      // Return raw DB data (snake_case)
      return data;
    },
    update: async (settings: Partial<ShopSettings>) => {
      const orgId = await db._getOrgId();
      if (!orgId) throw new Error("Organization ID required");

      // 1. Fetch existing to merge (safe partial update)
      const { data: existing } = await supabase.from('settings').select('*').eq('organization_id', orgId).single();

      const merged: any = {
        organization_id: orgId,
        ...existing,
        ...settings
      };

      // Ensure NO undefineds are passed to DB (which might not happen with spread but good to be safe)
      // Upsert needs to know the conflict key if we rely on it, but here we provide organization_id.

      // Update settings using snake_case properties directly
      const { error } = await supabase.from('settings').upsert({
        organization_id: orgId,
        interval_minutes: merged.interval_minutes,
        schedule: merged.schedule,
        establishment_name: merged.establishment_name,
        address: merged.address,
        phone: merged.phone,
        city: merged.city,
        state: merged.state,
        zip_code: merged.zip_code,
        primary_color: merged.primary_color,
        secondary_color: merged.secondary_color,
        loyalty_enabled: merged.loyalty_enabled,
        loyalty_target: merged.loyalty_target
      }, { onConflict: 'organization_id' });

      if (error) throw error;
    }

    // Note: Slug update was previously here but removed because 'slug' is not in settings table type anymore.
    // If we need to update slug, it should be a separate Organization update method.
  },

  // --- ORGANIZATIONS ---
  organizations: {
    get: async () => {
      const orgId = await db._getOrgId();
      if (!orgId) return null;

      const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).single();
      if (error) throw error;
      return data;
    },
    update: async (updates: any) => {
      const orgId = await db._getOrgId();
      if (!orgId) throw new Error("Organization not found");

      const { error } = await supabase.from('organizations').update(updates).eq('id', orgId);
      if (error) throw error;
    }
  }
};

