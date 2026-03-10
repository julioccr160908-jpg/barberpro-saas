import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
// Lazy Load Admin Components
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminStaffManager = React.lazy(() => import('./components/AdminStaffManager').then(module => ({ default: module.AdminStaffManager })));
const AdminServicesManager = React.lazy(() => import('./components/AdminServicesManager').then(module => ({ default: module.AdminServicesManager })));
const AdminCustomersManager = React.lazy(() => import('./components/AdminCustomersManager').then(module => ({ default: module.AdminCustomersManager })));
const AdminTimeSettings = React.lazy(() => import('./components/AdminTimeSettings').then(module => ({ default: module.AdminTimeSettings })));
const AdminSettings = React.lazy(() => import('./components/AdminSettings').then(module => ({ default: module.AdminSettings })));
const AdminNotificationSettings = React.lazy(() => import('./components/admin/AdminNotificationSettings').then(module => ({ default: module.AdminNotificationSettings })));
const AdminFinancials = React.lazy(() => import('./components/admin/AdminFinancials').then(module => ({ default: module.AdminFinancials })));
const AdminLoyaltySettings = React.lazy(() => import('./components/admin/AdminLoyaltySettings').then(module => ({ default: module.AdminLoyaltySettings })));
const AdminMarketing = React.lazy(() => import('./components/admin/AdminMarketing').then(module => ({ default: module.AdminMarketing })));
const AdminInventory = React.lazy(() => import('./components/admin/AdminInventory').then(module => ({ default: module.AdminInventory })));
const AdminSubscriptions = React.lazy(() => import('./components/admin/AdminSubscriptions').then(module => ({ default: module.AdminSubscriptions })));
const AdminPerformance = React.lazy(() => import('./components/admin/AdminPerformance').then(module => ({ default: module.AdminPerformance })));
const Schedule = React.lazy(() => import('./components/Schedule').then(module => ({ default: module.Schedule })));

// Lazy Load Platform Components
const PlatformLayout = React.lazy(() => import('./components/platform/PlatformLayout').then(module => ({ default: module.PlatformLayout })));
const PlatformDashboard = React.lazy(() => import('./components/platform/PlatformDashboard').then(module => ({ default: module.PlatformDashboard })));
const OrganizationsList = React.lazy(() => import('./components/platform/OrganizationsList').then(module => ({ default: module.OrganizationsList })));
const PlatformUsers = React.lazy(() => import('./components/platform/PlatformUsers').then(module => ({ default: module.PlatformUsers })));
const PlatformSettings = React.lazy(() => import('./components/platform/PlatformSettings').then(module => ({ default: module.PlatformSettings })));
const PlatformGrowth = React.lazy(() => import('./components/platform/PlatformGrowth').then(module => ({ default: module.PlatformGrowth })));
const PlatformMonitoring = React.lazy(() => import('./components/platform/PlatformMonitoring').then(module => ({ default: module.PlatformMonitoring })));
const PlatformBroadcasts = React.lazy(() => import('./components/platform/PlatformBroadcasts').then(module => ({ default: module.PlatformBroadcasts })));

import { MockPaymentPage } from './components/checkout/MockPaymentPage';
import { BookingSuccess } from './components/checkout/BookingSuccess';
import { BookingFlow } from './components/BookingFlow';
import { CustomerLayout } from './components/customer/CustomerLayout';
import { ConditionalCustomerLayout } from './components/customer/ConditionalCustomerLayout';
import { CustomerAppointments } from './components/customer/CustomerAppointments';
import { CustomerProfile } from './components/customer/CustomerProfile';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { RegisterSuccess } from './components/RegisterSuccess';
import { Role } from './types';
import { Button } from './components/ui/Button';
import { SettingsProvider } from './contexts/SettingsContext';
import { db } from './services/database';
import { supabase } from './services/supabase';
import { Loader2, AlertTriangle, CreditCard } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrganizationProvider, useOrganization } from './contexts/OrganizationContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { Toaster } from 'sonner';
import { Landing } from './components/Landing';
import { SystemBroadcastBanner } from './components/SystemBroadcastBanner';


// Wrapper for internal app layout (Sidebar + Content)
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const { role, loading: authLoading, user } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    const hasOverride = localStorage.getItem('su_org_override');
    if (hasOverride && role === Role.SUPER_ADMIN) {
      setIsImpersonating(true);
    } else if (hasOverride && role && role !== Role.SUPER_ADMIN) {
      // Clear stale override for non-super-admin users
      localStorage.removeItem('su_org_override');
      setIsImpersonating(false);
    }
  }, [role]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Enforce restrictions on route change too
  useEffect(() => {
    // If impersonating, we skip role checks or assume Admin
    const checkRole = isImpersonating ? Role.ADMIN : role;

    if (!authLoading && checkRole === Role.BARBER) {
      const restrictedPaths = ['dashboard', 'staff', 'services', 'settings'];
      const isRestricted = restrictedPaths.some(path => location.pathname.includes(path));
      if (isRestricted) {
        navigate('/admin/schedule');
      }
    }
  }, [location, role, authLoading, navigate, isImpersonating]);

  // Sync sidebar state with URL
  useEffect(() => {
    if (location.pathname.includes('dashboard')) setCurrentView('dashboard');
    if (location.pathname.includes('schedule')) setCurrentView('schedule');
    if (location.pathname.includes('staff')) setCurrentView('staff');
    if (location.pathname.includes('customers')) setCurrentView('customers');
    if (location.pathname.includes('services')) setCurrentView('services');
    if (location.pathname.includes('financials')) setCurrentView('financials');
    if (location.pathname.includes('notifications')) setCurrentView('notifications');
    if (location.pathname.includes('loyalty')) setCurrentView('loyalty');
    if (location.pathname.includes('settings')) setCurrentView('settings');
    if (location.pathname.includes('marketing')) setCurrentView('marketing');
    if (location.pathname.includes('inventory')) setCurrentView('inventory');
    if (location.pathname.includes('subscriptions')) setCurrentView('subscriptions');
    if (location.pathname.includes('performance')) setCurrentView('performance');
  }, [location]);

  // Navigation handler from Sidebar
  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view === 'dashboard') navigate('/admin/dashboard');
    if (view === 'schedule') navigate('/admin/schedule');
    if (view === 'staff') navigate('/admin/staff');
    if (view === 'customers') navigate('/admin/customers');
    if (view === 'services') navigate('/admin/services');
    if (view === 'financials') navigate('/admin/financials');
    if (view === 'notifications') navigate('/admin/notifications');
    if (view === 'loyalty') navigate('/admin/loyalty');
    if (view === 'settings') navigate('/admin/settings');
    if (view === 'marketing') navigate('/admin/marketing');
    if (view === 'inventory') navigate('/admin/inventory');
    if (view === 'subscriptions') navigate('/admin/subscriptions');
    if (view === 'performance') navigate('/admin/performance');
  };

  const handleExitImpersonation = () => {
    localStorage.removeItem('su_org_override');
    window.location.href = '/platform/organizations';
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
  }

  // Fallback for role (should be set if not loading)
  // If impersonating, force ADMIN view regardless of actual role
  const safeRole = isImpersonating ? Role.ADMIN : (role || Role.CUSTOMER);

  // Downgrade Enforcement Logic
  const isOverStaffLimit = organization
      && typeof organization.activeStaffCount === 'number'
      && typeof organization.staffLimit === 'number'
      && organization.activeStaffCount > organization.staffLimit;

  const shouldBlockDowngrade = isOverStaffLimit && safeRole !== Role.SUPER_ADMIN && safeRole !== Role.CUSTOMER;
  const isAllowedDowngradeRoute = location.pathname.includes('/admin/staff') || location.pathname.includes('/admin/settings');
  
  // Past Due Enforcement Logic
  const isPastDue = organization?.subscriptionStatus === 'past_due';
  const shouldBlockPastDue = isPastDue && safeRole !== Role.SUPER_ADMIN && safeRole !== Role.CUSTOMER;
  const isAllowedPastDueRoute = location.pathname.includes('/admin/settings');

  let content = children;
  
  if (shouldBlockPastDue && !isAllowedPastDueRoute) {
      content = (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in">
              <div className="bg-orange-500/10 p-4 rounded-full mb-6">
                  <CreditCard size={48} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Pagamento Pendente</h2>
              <p className="text-zinc-400 max-w-md mb-8">
                  Identificamos uma pendência no pagamento da sua assinatura. Para continuar acessando o sistema e recebendo agendamentos, por favor regularize o pagamento.
              </p>
              <Button onClick={() => navigate('/admin/settings?tab=subscription')} variant="outline" className="bg-orange-500 text-white hover:bg-orange-600 w-full sm:w-auto">
                  Regularizar Assinatura
              </Button>
          </div>
      );
  } else if (shouldBlockDowngrade && !isAllowedDowngradeRoute && !shouldBlockPastDue) {
      content = (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in">
              <div className="bg-red-500/10 p-4 rounded-full mb-6">
                  <AlertTriangle size={48} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Limite de Profissionais Excedido</h2>
              <p className="text-zinc-400 max-w-md mb-8">
                  O plano atual da sua barbearia permite até {organization.staffLimit} profissionais, mas você tem {organization.activeStaffCount} ativos no momento. Para continuar usando as outras funções do sistema, por favor se adeque ao limite.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/admin/staff')} variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10 w-full sm:w-auto">
                      Gerenciar Profissionais
                  </Button>
                  <Button onClick={() => navigate('/admin/settings?tab=subscription')} className="bg-primary text-black hover:bg-primary/90 w-full sm:w-auto">
                      Assinar o Plano Pro
                  </Button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-background text-textMain font-sans flex overflow-hidden">
      <Sidebar
        currentRole={safeRole}
        currentView={currentView}
        setCurrentView={handleViewChange}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-y-auto h-screen transition-all duration-300 relative">
        {isImpersonating && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg mb-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <span className="font-bold">MODO DE SUPER ADMIN:</span>
              <span>Você está acessando o painel desta barbearia.</span>
            </div>
            <Button size="sm" variant="outline" className="bg-red-500 text-white hover:bg-red-600" onClick={handleExitImpersonation}>
              Sair do Acesso
            </Button>
          </div>
        )}
        <div className="mt-12 lg:mt-0 max-w-7xl mx-auto">
          <SystemBroadcastBanner />
          {content}
        </div>
      </main>
    </div>
  );
};



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
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <AuthProvider>
        <OrganizationProvider>
          <SettingsProvider>
            <BrowserRouter>
              <React.Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin" /></div>}>
                <Routes>
                  <Route path="/" element={<Landing />} />

                  {/* Auth Route */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/register-success" element={<RegisterSuccess />} />


                  {/* Customer Routes - All Protected by Layout in Component or here */}

                  {/* Redirect /book to new structure or keep as is? 
                Let's keep /book as the main entry but wrap it or redirect after login 
            */}
                  <Route path="/book" element={
                    <ConditionalCustomerLayout>
                      <BookingFlow />
                    </ConditionalCustomerLayout>
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

                  {/* Super Admin / Platform Routes */}
                  <Route path="/platform/*" element={
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
                      <PlatformLayout>
                        <Routes>
                          <Route path="dashboard" element={<PlatformDashboard />} />
                          <Route path="organizations" element={<OrganizationsList />} />
                          <Route path="users" element={<PlatformUsers />} />
                          <Route path="growth" element={<PlatformGrowth />} />
                          <Route path="monitoring" element={<PlatformMonitoring />} />
                          <Route path="broadcasts" element={<PlatformBroadcasts />} />
                          <Route path="settings" element={<PlatformSettings />} />
                        </Routes>
                      </PlatformLayout>
                    </ProtectedRoute>
                  } />

                  {/* Admin / Staff Routes */}
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                      <AppLayout>
                        <AdminDashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/schedule" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN, Role.BARBER]}>
                      <AppLayout>
                        <Schedule />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/staff" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                      <AppLayout>
                        <AdminStaffManager />
                      </AppLayout>
                    </ProtectedRoute>
                  } />


                  <Route path="/admin/services" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                      <AppLayout>
                        <AdminServicesManager />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/notifications" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                      <AppLayout>
                        <AdminNotificationSettings />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/financials" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                      <AppLayout>
                        <AdminFinancials />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/checkout/mock" element={<MockPaymentPage />} />
                  <Route path="/booking/success" element={<BookingSuccess />} />

                  <Route path="/admin/loyalty" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                      <AppLayout>
                        <AdminLoyaltySettings />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/marketing" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN, Role.BARBER]}>
                      <AppLayout>
                        <AdminMarketing />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/inventory" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                      <AppLayout>
                        <AdminInventory />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/subscriptions" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                      <AppLayout>
                        <AdminSubscriptions />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/performance" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                      <AppLayout>
                        <AdminPerformance />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/customers" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN, Role.BARBER]}>
                      <AppLayout>
                        <AdminCustomersManager />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/settings" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                      <AppLayout>
                        <AdminSettings />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  {/* Public Shop Page (Vanity URL) */}
                  <Route path="/:slug" element={
                    <ConditionalCustomerLayout>
                      <BookingFlow />
                    </ConditionalCustomerLayout>
                  } />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </React.Suspense>
            </BrowserRouter>
          </SettingsProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider >
  );
};

export default App;
