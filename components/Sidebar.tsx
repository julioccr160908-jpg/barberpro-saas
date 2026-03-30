import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Settings,
  LogOut,
  Menu,
  Bell,
  DollarSign,
  Gift,
  Megaphone,
  Package,
  CreditCard,
  ChevronDown,
  Building2,
  BarChart3,
  Image as ImageIcon
} from 'lucide-react';
import { Role } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

interface SidebarProps {
  currentRole: Role;
  setCurrentView: (view: string) => void;
  currentView: string;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, setCurrentView, currentView, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const { organization, switchOrganization } = useOrganization();
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);

  // Fetch all organizations this user can manage
  const { data: managedOrgs = [] } = useQuery({
    queryKey: ['managed-organizations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // 1. Orgs owned by user
      const { data: owned } = await supabase
        .from('organizations')
        .select('id, name, slug, logo_url')
        .eq('owner_id', user.id);

      // 2. Orgs where user is staff with explicit management rights
      let managedOrgsFromProfile: string[] = [];
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (prof && (prof as any).managed_orgs) {
          managedOrgsFromProfile = (prof as any).managed_orgs;
        }
      } catch (e) {
        console.warn("managed_orgs column might be missing");
      }

      let managed: any[] = [];
      if (managedOrgsFromProfile.length > 0) {
        const { data } = await supabase
          .from('organizations')
          .select('id, name, slug, logo_url')
          .in('id', managedOrgsFromProfile);
        managed = data || [];
      }

      // Combine and unique
      const combined = [...(owned || []), ...managed];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      return unique;
    },
    enabled: !!user && currentRole !== Role.CUSTOMER
  });

  const menuGroups = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: [Role.ADMIN] },
        { id: 'schedule', label: 'Agenda', icon: Calendar, role: [Role.ADMIN, Role.BARBER] },
        { id: 'customers', label: 'Clientes', icon: Users, role: [Role.ADMIN, Role.BARBER] },
      ]
    },
    {
      title: 'Gestão',
      items: [
        { id: 'financials', label: 'Financeiro', icon: DollarSign, role: [Role.ADMIN] },
        { id: 'inventory', label: 'Estoque', icon: Package, role: [Role.ADMIN] },
        { id: 'marketing', label: 'Marketing', icon: Megaphone, role: [Role.ADMIN, Role.BARBER] },
        { id: 'loyalty', label: 'Fidelidade', icon: Gift, role: [Role.ADMIN] },
        { id: 'performance', label: 'Desempenho', icon: BarChart3, role: [Role.ADMIN] },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'services', label: 'Serviços', icon: Scissors, role: [Role.ADMIN] },
        { id: 'staff', label: 'Profissionais', icon: Users, role: [Role.ADMIN] },
        { id: 'gallery', label: 'Portfólio', icon: ImageIcon, role: [Role.ADMIN, Role.BARBER] },
        { id: 'notifications', label: 'Notificações', icon: Bell, role: [Role.ADMIN] },
        { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard, role: [Role.ADMIN] },
        { id: 'settings', label: 'Configurações', icon: Settings, role: [Role.ADMIN] },
      ]
    }
  ];

  const canShowItem = (itemRoles: Role[]) =>
    itemRoles.includes(currentRole) ||
    (currentRole === Role.SUPER_ADMIN && itemRoles.includes(Role.ADMIN));


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
        fixed inset-y-0 left-0 z-40 w-60 bg-[#09090b] 
        transform transition-transform duration-300 ease-out shadow-2xl
        flex flex-col border-r border-white/5
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Area & Org Switcher */}
          <div className="h-14 flex items-center px-4 justify-between border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  backgroundColor: organization?.primaryColor || '#D4AF37',
                  boxShadow: `0 0 10px ${(organization?.primaryColor || '#D4AF37')}33`
                }}
              >
                <Scissors size={14} className="text-black transform -rotate-45" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-semibold text-sm tracking-tight text-white leading-none">{organization?.name || 'BarberHost'}</span>
                <span className="text-xs text-zinc-500 tracking-wide uppercase mt-0.5">Management</span>
              </div>
            </div>
          </div>

          {/* Org Switcher Trigger */}
          {managedOrgs.length > 1 && (
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowOrgSwitcher(!showOrgSwitcher)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5 group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors flex-shrink-0">
                    {organization?.logoUrl ? (
                      <img src={organization.logoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Building2 size={16} />
                    )}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{organization?.name || 'Selecionar Unidade'}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Unidade Atual</p>
                  </div>
                </div>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform ${showOrgSwitcher ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {showOrgSwitcher && (
                <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {managedOrgs.filter(org => org.id !== organization?.id).map((org: any) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        switchOrganization(org.id);
                        setShowOrgSwitcher(false);
                        toast.success(`Alternado para ${org.name}`);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-lg transition-colors group"
                    >
                      <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-zinc-400">
                        <Building2 size={12} />
                      </div>
                      <span className="text-xs text-zinc-400 group-hover:text-white truncate">{org.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter(item => canShowItem(item.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <p className="px-4 text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-2">
                  {group.title}
                </p>
                {visibleItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        if (window.innerWidth < 1024) setIsOpen(false);
                      }}
                      className={`
                          w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden
                          ${isActive
                          ? 'text-black font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }
                        `}
                      style={isActive ? { boxShadow: `0 0 20px ${(organization?.primaryColor || '#D4AF37')}33` } : {}}
                    >
                      {/* Active Background with Gradient */}
                      {isActive && (
                        <div
                          className="absolute inset-0 opacity-100"
                          style={{ backgroundColor: organization?.primaryColor || '#D4AF37' }}
                        />
                      )}

                      <item.icon size={18} className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="relative z-10">{item.label}</span>

                      {isActive && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-black rounded-full shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5 bg-black/40">
          <div className="flex items-center justify-between group px-1">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full border overflow-hidden shrink-0"
                style={{ borderColor: `${(organization?.primaryColor || '#D4AF37')}22` }}
              >
                <img
                  src={profile?.avatarUrl || `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=EAB308&color=000`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate max-w-[100px] leading-tight">{profile?.name || 'Usuário'}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wide leading-tight">{profile?.role || 'Admin'}</span>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};