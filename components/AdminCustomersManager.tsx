
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Trash2, Search, Loader2, User, Phone, Mail } from 'lucide-react';
import { Input } from './ui/Input';
import { Role } from '../types';
import { toast } from 'sonner';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
}

export const AdminCustomersManager: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);

            // Get Org ID
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id).single();
            const orgId = profile?.organization_id;

            if (!orgId) {
                setCustomers([]);
                return;
            }

            // Get customers who have appointments in this organization
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    customer:customer_id (
                        id,
                        name,
                        email,
                        phone,
                        avatar_url
                    )
                `)
                .eq('organization_id', orgId);

            if (error) throw error;

            // Extract unique customers (a customer may have multiple appointments)
            const uniqueCustomers = new Map<string, Customer>();
            data?.forEach((appointment: any) => {
                if (appointment.customer && !uniqueCustomers.has(appointment.customer.id)) {
                    uniqueCustomers.set(appointment.customer.id, {
                        id: appointment.customer.id,
                        name: appointment.customer.name,
                        email: appointment.customer.email,
                        phone: appointment.customer.phone,
                        avatar_url: appointment.customer.avatar_url
                    });
                }
            });

            setCustomers(Array.from(uniqueCustomers.values()).sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Erro ao carregar clientes');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir o cliente ${name}? Isso removerá o histórico de agendamentos.`)) {
            return;
        }

        try {
            setDeleteLoading(id);

            // Since we don't have a backend function to fully delete a user from Auth, 
            // we will just delete the profile. The user might still exist in Auth but won't be usable.
            // Ideally, a cascading delete or edge function would be used.

            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setCustomers(customers.filter(c => c.id !== id));
            toast.success('Cliente removido com sucesso.');
        } catch (error: any) {
            console.error('Error deleting customer:', error);
            toast.error('Erro ao excluir cliente: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setDeleteLoading(null);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gerenciar Clientes</h2>
                    <p className="text-textMuted">Visualize e gerencie a base de clientes da barbearia.</p>
                </div>

                <div className="w-full md:w-64">
                    <Input
                        placeholder="Buscar por nome, email ou telefone..."
                        icon={<Search size={18} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="text-center py-12 text-textMuted">
                        <User size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Nenhum cliente encontrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-xs text-textMuted uppercase tracking-wider">
                                    <th className="p-4 pl-6 font-semibold">Cliente</th>
                                    <th className="p-4 font-semibold">Contato</th>
                                    <th className="p-4 font-semibold">Email</th>
                                    <th className="p-4 pr-6 text-right font-semibold">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-surfaceHighlight flex items-center justify-center overflow-hidden border border-white/10">
                                                    {customer.avatar_url ? (
                                                        <img src={customer.avatar_url} alt={customer.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-lg font-bold text-primary">{customer.name?.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{customer.name || 'Sem Nome'}</p>
                                                    <p className="text-xs text-textMuted text-ellipsis max-w-[150px] overflow-hidden">ID: {customer.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-textMuted text-sm">
                                                <Phone size={14} className="text-primary/70" />
                                                <span>{customer.phone || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-textMuted text-sm">
                                                <Mail size={14} className="text-primary/70" />
                                                <span className="truncate max-w-[200px]">{customer.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
                                                onClick={() => handleDelete(customer.id, customer.name)}
                                                disabled={deleteLoading === customer.id}
                                            >
                                                {deleteLoading === customer.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <div className="text-right text-xs text-textMuted">
                Total de clientes: {filteredCustomers.length}
            </div>
        </div>
    );
};
