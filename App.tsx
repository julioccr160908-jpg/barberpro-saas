
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminStaffManager } from './components/AdminStaffManager';
import { AdminServicesManager } from './components/AdminServicesManager';
import { AdminCustomersManager } from './components/AdminCustomersManager';
import { AdminTimeSettings } from './components/AdminTimeSettings';
import { BookingFlow } from './components/BookingFlow';
import { Schedule } from './components/Schedule';
import { CustomerLayout } from './components/customer/CustomerLayout';
import { CustomerAppointments } from './components/customer/CustomerAppointments';
import { CustomerProfile } from './components/customer/CustomerProfile';
import { Login } from './components/Login';
import { Role } from './types';
import { Button } from './components/ui/Button';
import { SettingsProvider } from './contexts/SettingsContext';
import { db } from './services/database';
import { supabase } from './services/supabase';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';


// Wrapper for internal app layout (Sidebar + Content)
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const { role, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Enforce restrictions on route change too
  useEffect(() => {
    if (!authLoading && role === Role.BARBER) {
      const restrictedPaths = ['dashboard', 'staff', 'services', 'settings'];
      const isRestricted = restrictedPaths.some(path => location.pathname.includes(path));
      if (isRestricted) {
        navigate('/admin/schedule');
      }
    }
  }, [location, role, authLoading, navigate]);

  // Sync sidebar state with URL
  useEffect(() => {
    if (location.pathname.includes('dashboard')) setCurrentView('dashboard');
    if (location.pathname.includes('schedule')) setCurrentView('schedule');
    if (location.pathname.includes('staff')) setCurrentView('staff');
    if (location.pathname.includes('customers')) setCurrentView('customers');
    if (location.pathname.includes('services')) setCurrentView('services');
    if (location.pathname.includes('settings')) setCurrentView('settings');
  }, [location]);

  // Navigation handler from Sidebar
  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view === 'dashboard') navigate('/admin/dashboard');
    if (view === 'schedule') navigate('/admin/schedule');
    if (view === 'staff') navigate('/admin/staff');
    if (view === 'customers') navigate('/admin/customers');
    if (view === 'services') navigate('/admin/services');
    if (view === 'settings') navigate('/admin/settings');
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
  }

  // Fallback for role (should be set if not loading)
  const safeRole = role || Role.CUSTOMER;

  return (
    <div className="min-h-screen bg-background text-textMain font-sans flex overflow-hidden">
      <Sidebar
        currentRole={safeRole}
        currentView={currentView}
        setCurrentView={handleViewChange}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-y-auto h-screen transition-all duration-300">
        <div className="mt-12 lg:mt-0 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// Landing / Role Selection Page (For Demo Purposes)
import { useSettings } from './contexts/SettingsContext';
import { MapPin } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const handleOpenMaps = () => {
    if (!settings.address) return;
    const fullAddress = `${settings.address}, ${settings.city || ''} - ${settings.state || ''}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <div className="relative z-10 text-center max-w-lg p-8">
        <h1 className="text-6xl font-display font-bold text-white mb-2 tracking-tighter">BARBER<span className="text-primary">PRO</span></h1>
        <p className="text-textMuted mb-12 text-lg">Sistema de Gestão Premium para Barbearias</p>

        <div className="space-y-4 w-full">
          <Button fullWidth size="lg" onClick={() => navigate('/login?role=admin')}>
            Entrar como Dono (Admin)
          </Button>
          <Button fullWidth size="lg" variant="secondary" onClick={() => navigate('/login?role=customer')}>
            Área do Cliente (Agendar)
          </Button>


        </div>

        <p className="mt-8 text-xs text-white/30">Versão Demo v1.0.0</p>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  // Initialize Database on App Load
  useEffect(() => {
    const initDb = async () => {
      try {
        await db.init();
      } catch (error) {
        console.error("Failed to initialize database", error);
      }
    };
    initDb();
  }, []);

  return (
    <SettingsProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Landing />} />

            {/* Auth Route */}
            <Route path="/login" element={<Login />} />


            {/* Customer Routes - All Protected by Layout in Component or here */}

            {/* Redirect /book to new structure or keep as is? 
                Let's keep /book as the main entry but wrap it or redirect after login 
            */}
            <Route path="/book" element={
              <CustomerLayout>
                <BookingFlow />
              </CustomerLayout>
            } />

            <Route path="/customer/appointments" element={
              <CustomerLayout>
                <CustomerAppointments />
              </CustomerLayout>
            } />

            <Route path="/customer/profile" element={
              <CustomerLayout>
                <CustomerProfile />
              </CustomerLayout>
            } />

            {/* Admin / Staff Routes */}
            <Route path="/admin/dashboard" element={
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            } />

            <Route path="/admin/schedule" element={
              <AppLayout>
                <Schedule />
              </AppLayout>
            } />

            <Route path="/admin/staff" element={
              <AppLayout>
                <AdminStaffManager />
              </AppLayout>
            } />


            <Route path="/admin/services" element={
              <AppLayout>
                <AdminServicesManager />
              </AppLayout>
            } />

            <Route path="/admin/customers" element={
              <AppLayout>
                <AdminCustomersManager />
              </AppLayout>
            } />

            <Route path="/admin/settings" element={
              <AppLayout>
                <AdminTimeSettings />
              </AppLayout>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </SettingsProvider>
  );
};

export default App;
