import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Scissors, Users, ShoppingBag, Settings, LogOut, Menu } from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  currentRole: Role;
  setCurrentView: (view: string) => void;
  currentView: string;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, setCurrentView, currentView, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: [Role.ADMIN] },
    { id: 'schedule', label: 'Agenda', icon: Calendar, role: [Role.ADMIN, Role.BARBER] },
    { id: 'customers', label: 'Clientes', icon: Users, role: [Role.ADMIN] },
    { id: 'services', label: 'Serviços', icon: Scissors, role: [Role.ADMIN] },
    { id: 'staff', label: 'Profissionais', icon: Users, role: [Role.ADMIN] },
    { id: 'settings', label: 'Configurações', icon: Settings, role: [Role.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => item.role.includes(currentRole));

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-surface rounded-md border border-border text-white"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
                <Scissors size={18} className="text-black" />
              </div>
              <span className="font-display font-bold text-xl tracking-wider text-white">BARBER<span className="text-primary">PRO</span></span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <p className="px-4 text-xs font-semibold text-textMuted uppercase tracking-wider mb-4">Menu Principal</p>
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
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-textMuted hover:text-white hover:bg-surfaceHighlight'}
                  `}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface border border-border/50">
              <img
                src="https://picsum.photos/40/40"
                alt="User"
                className="w-8 h-8 rounded-full border border-primary"
              />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">Admin User</p>
                <p className="text-xs text-textMuted truncate">Role: {currentRole}</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="text-textMuted hover:text-red-500 transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};