
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Globe, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

const PlatformSidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, path: '/platform/dashboard' },
        { id: 'organizations', label: 'Barbearias', icon: Globe, path: '/platform/organizations' },
        { id: 'users', label: 'Usuários Globais', icon: Users, path: '/platform/users' },
        { id: 'settings', label: 'Config. da Plataforma', icon: Settings, path: '/platform/settings' },
    ];

    return (
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
            <div className="h-20 flex items-center px-6 border-b border-zinc-800">
                <span className="font-display font-bold text-xl tracking-wider text-white">
                    PLATFORM<span className="text-blue-500">ADMIN</span>
                </span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => {
                    const isActive = location.pathname.includes(item.path);
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-800">
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-red-400 transition-colors"
                >
                    <LogOut size={18} />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
};

export const PlatformLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, role, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else if (role !== Role.SUPER_ADMIN) {
                // Determine where to send non-super admins
                if (role === Role.ADMIN || role === Role.BARBER) {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/book'); // Customer
                }
            }
        }
    }, [user, role, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    // Safety check - render nothing if redirecting (though useEffect handles it, this prevents flash)
    if (!user || role !== Role.SUPER_ADMIN) return null;

    return (
        <div className="min-h-screen bg-black text-white flex">
            <PlatformSidebar />
            <main className="flex-1 overflow-y-auto h-screen bg-black">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
