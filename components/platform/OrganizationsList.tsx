import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Organization } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Search, Building2, ExternalLink, MoreVertical, Ban, CheckCircle } from 'lucide-react';
import { CreateOrganizationModal } from './CreateOrganizationModal';

export const OrganizationsList: React.FC = () => {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadOrgs();
    }, []);

    const loadOrgs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        if (data) {
            // Map snake_case from DB to camelCase for the UI
            const mappedOrgs = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                slug: item.slug,
                ownerId: item.owner_id,
                subscriptionStatus: item.subscription_status,
                planType: item.plan_type,
                createdAt: item.created_at
            }));
            setOrgs(mappedOrgs);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">Barbearias</h1>
                    <p className="text-zinc-400">Gerencie seus clientes e assinaturas.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} className="mr-2" />
                    Nova Barbearia
                </Button>
            </div>

            <Card noPadding className="bg-zinc-900 border-zinc-800">
                <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, slug ou dono..."
                            className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="divide-y divide-zinc-800">
                    {orgs.map((org) => (
                        <div key={org.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors 
                                    ${org.subscriptionStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zinc-800 text-zinc-400 group-hover:text-white'}`}>
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                        {org.name}
                                        {org.subscriptionStatus === 'pending' && (
                                            <span className="bg-yellow-500 text-black text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                                                Pendente
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <span className="font-mono bg-zinc-800 px-1.5 rounded text-xs">{org.slug}</span>
                                        <span>•</span>
                                        <span className={`capitalize ${org.subscriptionStatus === 'active' ? 'text-green-500' :
                                            org.subscriptionStatus === 'pending' ? 'text-yellow-500' : 'text-red-500'
                                            }`}>
                                            {org.subscriptionStatus}
                                        </span>
                                        <span>•</span>
                                        <span className="capitalize text-blue-400">{org.planType}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {org.subscriptionStatus === 'pending' ? (
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white border-none" onClick={async () => {
                                        if (window.confirm(`Aprovar a barbearia "${org.name}"?`)) {
                                            try {
                                                const { error } = await supabase.from('organizations').update({ subscription_status: 'active' }).eq('id', org.id);
                                                if (error) {
                                                    console.error('Error approving org:', error);
                                                    alert('Erro ao aprovar: ' + error.message);
                                                } else {
                                                    loadOrgs();
                                                    alert('Barbearia aprovada com sucesso!');
                                                }
                                            } catch (err: any) {
                                                console.error('Exception approving org:', err);
                                                alert('Erro inesperado: ' + err.message);
                                            }
                                        }
                                    }}>
                                        <CheckCircle size={16} className="mr-2" />
                                        Aprovar
                                    </Button>
                                ) : (
                                    <Button variant="secondary" size="sm" className="hidden group-hover:flex">
                                        <ExternalLink size={16} className="mr-2" />
                                        Acessar Painel
                                    </Button>
                                )}

                                <button className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {!loading && orgs.length === 0 && (
                        <div className="p-12 text-center">
                            <Building2 size={48} className="mx-auto text-zinc-700 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Nenhuma barbearia encontrada</h3>
                            <p className="text-zinc-500 mb-6">Comece cadastrando seu primeiro cliente.</p>
                            <Button onClick={() => setIsModalOpen(true)}>
                                <Plus size={18} className="mr-2" />
                                Criar Barbearia
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            <CreateOrganizationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadOrgs}
            />
        </div>
    );
};
