
import { Service, User, Appointment, ShopSettings, AppointmentStatus } from '../types';
import { SEED_SERVICES, SEED_STAFF, SEED_APPOINTMENTS } from '../constants';

const DB_KEY = 'barberpro_db_v1';

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
  intervalMinutes: 45,
  schedule: DEFAULT_SCHEDULE
};


import { supabase } from './supabase';

export const db = {
  // Initialize DB (No longer needed for Supabase as it persists remotely, but kept for compatibility if needed)
  init: async () => {
    // Optional: Check connection or run initial setup if needed
    const { error } = await supabase.from('settings').select('id').single();
    if (error && error.code === 'PGRST116') {
      // Create initial settings if missing
      await supabase.from('settings').insert([{
        id: 1,
        interval_minutes: DEFAULT_SETTINGS.intervalMinutes,
        schedule: DEFAULT_SETTINGS.schedule
      }]);
    }
  },

  // --- SERVICES ---
  services: {
    list: async (): Promise<Service[]> => {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      return data.map(s => ({
        ...s,
        durationMinutes: s.duration_minutes,
        imageUrl: s.image_url
      }));
    },
    create: async (service: Service) => {
      const { data, error } = await supabase.from('services').insert([{
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
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'CUSTOMER');
      if (error) throw error;
      return data.map(u => ({
        ...u,
        avatarUrl: u.avatar_url,
        jobTitle: u.job_title
      }));
    }
  },

  // --- STAFF ---
  staff: {
    list: async (): Promise<User[]> => {
      const { data, error } = await supabase.from('profiles').select('*').in('role', ['BARBER', 'ADMIN']);
      if (error) throw error;
      return data.map(u => ({
        ...u,
        avatarUrl: u.avatar_url,
        jobTitle: u.job_title
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
        job_title: user.jobTitle
      }]).select().single();

      if (error) throw error;
      return { ...data, avatarUrl: data.avatar_url, jobTitle: data.job_title };
    },
    update: async (updated: User) => {
      const { error } = await supabase.from('profiles').update({
        name: updated.name,
        email: updated.email,
        role: updated.role,
        avatar_url: updated.avatarUrl,
        job_title: updated.jobTitle
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
    list: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase.from('appointments').select('*');
      if (error) throw error;
      return data.map(a => ({
        id: a.id,
        barberId: a.barber_id,
        customerId: a.customer_id,
        serviceId: a.service_id,
        date: a.date,
        status: a.status
      }));
    },
    create: async (appt: Appointment) => {
      const { data, error } = await supabase.from('appointments').insert([{
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
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
      if (error) throw error;
    }
  },

  // --- SETTINGS ---
  settings: {
    get: async (): Promise<ShopSettings> => {
      const { data, error } = await supabase.from('settings').select('*').single();
      if (error) {
        // Fallback or init
        return DEFAULT_SETTINGS;
      }
      return {
        intervalMinutes: data.interval_minutes,
        schedule: data.schedule,
        establishmentName: data.establishment_name,
        address: data.address,
        phone: data.phone,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code
      };
    },
    update: async (settings: ShopSettings) => {
      const { error } = await supabase.from('settings').upsert({
        id: 1,
        interval_minutes: settings.intervalMinutes,
        schedule: settings.schedule,
        establishment_name: settings.establishmentName,
        address: settings.address,
        phone: settings.phone,
        city: settings.city,
        state: settings.state,
        zip_code: settings.zipCode
      });
      if (error) throw error;
    }
  }
};

