
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminStaffManager } from './components/AdminStaffManager';
import { AdminServicesManager } from './components/AdminServicesManager';
import { AdminTimeSettings } from './components/AdminTimeSettings';
import { BookingFlow } from './components/BookingFlow';
import { Schedule } from './components/Schedule';
import { Login } from './components/Login';
import { Role } from './types';
import { Button } from './components/ui/Button';
import { SettingsProvider } from './contexts/SettingsContext';
import { db } from './services/database';

// Wrapper for internal app layout (Sidebar + Content)
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  // Simple routing logic based on sidebar selection
  useEffect(() => {
    if (currentView === 'dashboard') navigate('/admin/dashboard');
    if (currentView === 'schedule') navigate('/admin/schedule');
    if (currentView === 'staff') navigate('/admin/staff');
    if (currentView === 'services') navigate('/admin/services');
    if (currentView === 'settings') navigate('/admin/settings');
  }, [currentView, navigate]);

  // Sync sidebar state with URL
  useEffect(() => {
    if (location.pathname.includes('dashboard')) setCurrentView('dashboard');
    if (location.pathname.includes('schedule')) setCurrentView('schedule');
    if (location.pathname.includes('staff')) setCurrentView('staff');
    if (location.pathname.includes('services')) setCurrentView('services');
    if (location.pathname.includes('settings')) setCurrentView('settings');
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-textMain font-sans flex overflow-hidden">
      <Sidebar 
        currentRole={Role.ADMIN} 
        currentView={currentView}
        setCurrentView={setCurrentView}
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
const Landing: React.FC = () => {
  const navigate = useNavigate();
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
    db.init();
  }, []);

  return (
    <SettingsProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          
          {/* Auth Route */}
          <Route path="/login" element={<Login />} />
          
          {/* Public Booking Route */}
          <Route path="/book" element={<BookingFlow />} />

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

          <Route path="/admin/settings" element={
            <AppLayout>
              <AdminTimeSettings />
            </AppLayout>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </SettingsProvider>
  );
};

export default App;
