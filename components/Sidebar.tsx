import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Scissors, Users, ShoppingBag, Settings, LogOut, Menu, Bell, DollarSign, Gift } from 'lucide-react';
import { Role } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentRole: Role;
  setCurrentView: (view: string) => void;
  currentView: string;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, setCurrentView, currentView, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: [Role.ADMIN] },
    { id: 'schedule', label: 'Agenda', icon: Calendar, role: [Role.ADMIN, Role.BARBER] },
    { id: 'customers', label: 'Clientes', icon: Users, role: [Role.ADMIN] },
    { id: 'services', label: 'Serviços', icon: Scissors, role: [Role.ADMIN] },
    { id: 'staff', label: 'Profissionais', icon: Users, role: [Role.ADMIN] },
    { id: 'financials', label: 'Financeiro', icon: DollarSign, role: [Role.ADMIN] },
    { id: 'notifications', label: 'Notificações', icon: Bell, role: [Role.ADMIN] },
    { id: 'loyalty', label: 'Fidelidade', icon: Gift, role: [Role.ADMIN] },
    { id: 'settings', label: 'Configurações', icon: Settings, role: [Role.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => item.role.includes(currentRole));

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-zinc-900 rounded-md border border-white/10 text-white shadow-lg"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#09090b] 
        transform transition-transform duration-300 ease-out shadow-2xl
        flex flex-col border-r border-white/5
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className="h-24 flex items-center px-8 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)] group-hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all">
              <Scissors size={20} className="text-black transform -rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl tracking-wider text-white leading-none">BARBER<span className="text-yellow-500">PRO</span></span>
              <span className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase mt-1">Management</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Menu Principal</p>
          {filteredItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden
                    ${isActive
                    ? 'text-black font-bold shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }
                  `}
              >
                {/* Active Background with Gradient */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-100" />
                )}

                {/* Icon */}
                <item.icon size={20} className={`relative z-10 ${isActive ? 'text-black' : 'text-zinc-500 group-hover:text-yellow-500 transition-colors'}`} />

                {/* Label */}
                <span className="relative z-10">{item.label}</span>

                {/* Active Indicator (Right Glow) */}
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-black/30 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div
            onClick={() => navigate('/admin/settings?tab=profile')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
          >
            <div className="relative">
              <img
                src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email || 'User'}`}
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-yellow-500 transition-colors bg-zinc-800 object-cover"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#18181b] rounded-full"></div>
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate group-hover:text-yellow-500 transition-colors">
                {profile?.name || 'Carregando...'}
              </p>
              <p className="text-xs text-zinc-500 truncate capitalize">{currentRole?.toLowerCase()}</p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="p-2 -mr-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>

          <p className="text-center text-[10px] text-zinc-700 mt-4">
            v1.2.0 • BarberPro SaaS
          </p>
        </div>
      </aside>
    </>
  );
};