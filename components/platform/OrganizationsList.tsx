import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Organization } from '../../types';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Search, Building2, ExternalLink, MoreVertical, Ban, CheckCircle, Trash2, LogIn, MonitorPlay, CreditCard, Mail } from 'lucide-react';
import { CreateOrganizationModal } from './CreateOrganizationModal';
import { SubscriptionDetailsModal } from './SubscriptionDetailsModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { PlatformService } from '../../services/PlatformService';

export const OrganizationsList: React.FC = () => {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrgForDetails, setSelectedOrgForDetails] = useState<Organization | null>(null);
    const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadOrgs();
    }, []);

    const loadOrgs = async () => {
        setLoading(true);
        try {
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: false });

            if (orgError) throw orgError;

            if (orgData) {
                // Fetch profiles for emails
                const ownerIds = [...new Set(orgData.map((o: any) => o.owner_id))].filter(Boolean);
                const profilesDict: Record<string, string> = {};

                if (ownerIds.length > 0) {
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('id, email')
                        .in('id', ownerIds);

                    if (profilesData) {
                        profilesData.forEach((p: any) => {
                            profilesDict[p.id] = p.email;
                        });
                    }
                }

                // Map snake_case from DB to camelCase for the UI
                const mappedOrgs = orgData.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    slug: item.slug,
                    ownerId: item.owner_id,
                    ownerEmail: profilesDict[item.owner_id] || 'Sem email vinculado',
                    subscriptionStatus: item.subscription_status,
                    planType: item.plan_type,
                    createdAt: item.created_at
                }));
                setOrgs(mappedOrgs);
            }
        } catch (error: any) {
            console.error('Error loading orgs:', error);
            toast.error('Erro ao carregar barbearias: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrgs = orgs.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (org.ownerEmail && org.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleConfirmAction = async () => {
        if (!orgToDelete) return;
        setDeleteLoading(true);
        try {
            if (orgToDelete.subscriptionStatus !== 'canceled') {
                const { error } = await supabase.from('organizations').update({ subscription_status: 'canceled' }).eq('id', orgToDelete.id);
                if (error) { toast.error('Erro ao cancelar: ' + error.message); }
                else { 
                    toast.success('Assinatura cancelada!'); 
                    await PlatformService.logAction({
                        action: 'CANCELED_SUBSCRIPTION',
                        entity_type: 'organization',
                        entity_id: orgToDelete.id,
                        organization_id: orgToDelete.id,
                        new_data: { status: 'canceled' }
                    });
                    loadOrgs(); 
                }
            } else {
                // Delete
                const { error } = await supabase.from('organizations').delete().eq('id', orgToDelete.id);
                if (error) {
                    console.error('Erro de deleção:', error);
                    toast.error('Erro ao excluir do banco de dados devido a registros dependentes. Contate o suporte ou certifique-se que o Supabase aplicou ON DELETE CASCADE nas migrações.');
                } else {
                    toast.success('Barbearia excluída com sucesso!');
                    await PlatformService.logAction({
                        action: 'DELETED_ORGANIZATION',
                        entity_type: 'organization',
                        entity_id: orgToDelete.id,
                        old_data: orgToDelete
                    });
                    loadOrgs();
                }
            }
        } catch (err: any) {
            toast.error('Erro inesperado: ' + err.message);
        } finally {
            setDeleteLoading(false);
            setIsDeleteModalOpen(false);
            setOrgToDelete(null);
        }
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

            <Card noPadding className="bg-zinc-900 border-zinc-800 !overflow-visible">
                <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, slug ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="divide-y divide-zinc-800 pb-32">
                    {filteredOrgs.map((org) => (
                        <div key={org.id} className="relative z-0 hover:z-50 p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors 
                                    ${org.subscriptionStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zinc-800 text-zinc-400 group-hover:text-white'}`}>
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                        {org.name || 'Barbearia Sem Nome'}
                                        {org.subscriptionStatus === 'pending' && (
                                            <span className="bg-yellow-500 text-black text-xs uppercase font-bold px-1.5 py-0.5 rounded">
                                                Pendente
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <span className="font-mono bg-zinc-800 px-1.5 rounded text-xs text-zinc-300">{org.slug}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Mail size={12} />
                                            {org.ownerEmail}
                                        </span>
                                        <span>•</span>
                                        <span className={`capitalize font-medium ${org.subscriptionStatus === 'active' ? 'text-green-500' :
                                            org.subscriptionStatus === 'pending' ? 'text-yellow-500' : 'text-red-500'
                                            }`}>
                                            {org.subscriptionStatus}
                                        </span>
                                        <span>•</span>
                                        <span className="capitalize text-blue-400">
                                            {org.planType === 'enterprise' ? 'premium' : org.planType}
                                        </span>
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
                                                    toast.error('Erro ao aprovar: ' + error.message);
                                                } else {
                                                    loadOrgs();
                                                    toast.success('Barbearia aprovada com sucesso!');
                                                    await PlatformService.logAction({
                                                        action: 'APPROVED_ORGANIZATION',
                                                        entity_type: 'organization',
                                                        entity_id: org.id,
                                                        organization_id: org.id
                                                    });
                                                }
                                            } catch (err: any) {
                                                console.error('Exception approving org:', err);
                                                toast.error('Erro inesperado: ' + err.message);
                                            }
                                        }
                                    }}>
                                        <CheckCircle size={16} className="mr-2" />
                                        Aprovar
                                    </Button>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="hidden group-hover:flex"
                                        onClick={() => {
                                            if (window.confirm(`Deseja acessar o painel de "${org.name}" como Administrador?`)) {
                                                localStorage.setItem('su_org_override', org.id);
                                                window.location.href = '/admin/dashboard';
                                            }
                                        }}
                                    >
                                        <MonitorPlay size={16} className="mr-2" />
                                        Acessar Painel
                                    </Button>
                                )}

                                <div className="group/menu relative">
                                    <button className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700">
                                        <MoreVertical size={18} />
                                    </button>

                                    <div className="absolute right-0 top-full pt-2 w-48 z-50 hidden group-hover/menu:block">
                                      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1">
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2"
                                            onClick={() => setSelectedOrgForDetails(org)}
                                        >
                                            <CreditCard size={16} />
                                            Detalhes do Pagamento
                                        </button>

                                        <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Mudar Plano</div>
                                        {['basic', 'pro', 'premium'].map(plan => (
                                            <button 
                                                key={plan} 
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 flex items-center justify-between ${org.planType === plan ? 'text-blue-400 font-medium' : 'text-zinc-300'}`}
                                                onClick={async () => {
                                                    const limits: Record<string, number> = { basic: 3, pro: 6, premium: 999 };
                                                    const { error } = await supabase.from('organizations').update({ 
                                                        plan_type: plan, 
                                                        staff_limit: limits[plan] 
                                                    }).eq('id', org.id);
                                                    
                                                    if (error) {
                                                        toast.error('Erro ao mudar plano');
                                                    } else {
                                                        toast.success(`Plano alterado para ${plan.toUpperCase()}`);
                                                        await PlatformService.logAction({
                                                            action: 'CHANGED_PLAN',
                                                            entity_type: 'organization',
                                                            entity_id: org.id,
                                                            organization_id: org.id,
                                                            old_data: { plan: org.planType },
                                                            new_data: { plan }
                                                        });
                                                        loadOrgs();
                                                    }
                                                }}
                                            >
                                                <span className="capitalize">{plan}</span>
                                                {org.planType === plan && <CheckCircle size={14} />}
                                            </button>
                                        ))}
                                        <div className="border-t border-zinc-800 my-1"></div>

                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2"
                                            onClick={() => {
                                                setOrgToDelete(org);
                                                setIsDeleteModalOpen(true);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                            {org.subscriptionStatus === 'canceled' ? 'Excluir definitivamente' : 'Cancelar assinatura'}
                                        </button>
                                      </div>
                                    </div>
                                </div>
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

            <SubscriptionDetailsModal
                isOpen={!!selectedOrgForDetails}
                onClose={() => setSelectedOrgForDetails(null)}
                organization={selectedOrgForDetails}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                loading={deleteLoading}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setOrgToDelete(null);
                }}
                onConfirm={handleConfirmAction}
                title={orgToDelete?.subscriptionStatus === 'canceled' ? 'Exclusão Permanente' : 'Cancelar Assinatura'}
                description={
                    orgToDelete?.subscriptionStatus === 'canceled'
                        ? `Você está prestes a excluir permanentemente a barbearia "${orgToDelete?.name}". Todos os dados relacionados (profissionais, unhas, agendamentos) serão perdidos. Esta ação é irreversível.`
                        : `Você está prestes a inativar a barbearia "${orgToDelete?.name}". Eles perderão acesso ao sistema e a geração de assinaturas será interrompida.`
                }
                warningMessage={orgToDelete?.subscriptionStatus === 'canceled' ? 'Atenção: A base de dados apagará tudo em cascata para evitar dados fantasmas.' : undefined}
                confirmText={orgToDelete?.subscriptionStatus === 'canceled' ? 'Sim, Excluir Tudo' : 'Sim, Cancelar'}
                isDestructive={true}
            />
        </div>
    );
};
