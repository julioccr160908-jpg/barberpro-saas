import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Users, Search, RefreshCw, Trash2, Mail, Shield } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Button } from '../ui/Button';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    organization_id: string;
    created_at: string;
    organizations?: {
        name: string;
        slug: string;
    };
}

export const PlatformUsers: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch profiles with organization info
            // Note: This requires a foreign key from profiles.organization_id to organizations.id
            const { data, error } = await supabase
                .from('profiles')
                .select('*, organizations(name, slug)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setUsers(data as any);

        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">Usuários Globais</h1>
                    <p className="text-zinc-400">Todos os usuários registrados na plataforma.</p>
                </div>
                <Button variant="secondary" onClick={fetchUsers}>
                    <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            <Card noPadding className="bg-zinc-900 border-zinc-800">
                <div className="p-4 border-b border-zinc-800">
                    <div className="relative max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou barbearia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="divide-y divide-zinc-800">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-bold">
                                    {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : <Users size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                        {user.full_name || 'Sem nome'}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${user.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                                                user.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-zinc-700 text-zinc-400'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Mail size={12} />
                                            {user.email}
                                        </span>
                                        {user.organizations && (
                                            <span className="flex items-center gap-1 text-zinc-400">
                                                <Shield size={12} />
                                                {user.organizations.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Actions like Reset Password could go here */}
                                <button className="p-2 text-zinc-500 hover:text-red-400 transition-colors" title="Ações indisponíveis" disabled>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {!loading && filteredUsers.length === 0 && (
                        <div className="p-12 text-center text-zinc-500">
                            Nenhum usuário encontrado.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
