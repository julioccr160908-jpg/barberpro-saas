import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../services/supabase';
import { db } from '../../services/database';
import { DollarSign, TrendingDown, TrendingUp, Plus, Trash2, Edit2, Loader2, X, AlertTriangle, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { AppointmentStatus, Expense } from '../../types';
import { toast } from 'sonner';
import { FeatureGate } from '../ui/FeatureGate';
import { useAuth } from '../../contexts/AuthContext';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Partial<Expense>) => Promise<void>;
    expense?: Expense | null;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSave, expense }) => {
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        category: 'Fixo'
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (expense) {
            setFormData({
                title: expense.title,
                amount: expense.amount.toString(),
                date: expense.date,
                category: expense.category
            });
        } else {
            setFormData({
                title: '',
                amount: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                category: 'Fixo'
            });
        }
    }, [expense, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                ...expense, // Preserve ID if editing
                title: formData.title,
                amount: Number(formData.amount),
                date: formData.date,
                category: formData.category
            });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar despesa');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-surface border border-white/10 p-6 rounded-lg w-full max-w-md shadow-xl animate-fade-in relative transition-all">
                <button onClick={onClose} className="absolute top-4 right-4 text-textMuted hover:text-white">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-4">{expense ? 'Editar Despesa' : 'Nova Despesa'}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-textMuted mb-1">Título</label>
                        <input
                            required
                            className="w-full bg-background border border-white/10 rounded px-3 py-2 text-white focus:border-primary outline-none"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Conta de Luz"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-textMuted mb-1">Valor (R$)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full bg-background border border-white/10 rounded px-3 py-2 text-white focus:border-primary outline-none"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-textMuted mb-1">Data</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-background border border-white/10 rounded px-3 py-2 text-white focus:border-primary outline-none"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-textMuted mb-1">Categoria</label>
                        <select
                            className="w-full bg-background border border-white/10 rounded px-3 py-2 text-white focus:border-primary outline-none"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Fixo">Fixo</option>
                            <option value="Variável">Variável</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Manutenção">Manutenção</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : (expense ? 'Salvar Alterações' : 'Adicionar Despesa')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const AdminFinancials: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const { isAdmin } = useAuth();

    // Date Filter (Default: Current Month)
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const org = await db.organizations.get();
        if (!org) {
            setLoading(false);
            return;
        }
        setOrganizationId(org.id);

        // Fetch Appointments (Revenue)
        const { data: appts } = await supabase
            .from('appointments')
            .select(`*, service:services(price), barber:profiles(name)`)
            .eq('organization_id', org.id)
            .eq('status', AppointmentStatus.COMPLETED);

        // Fetch Sales (Product sales + service totals)
        const { data: sls } = await supabase
            .from('sales')
            .select('*')
            .eq('organization_id', org.id)
            .eq('status', 'completed');

        // Fetch Expenses
        const { data: exp } = await supabase
            .from('expenses')
            .select('*')
            .eq('organization_id', org.id)
            .order('date', { ascending: false });

        if (appts) setAppointments(appts);
        if (sls) setSales(sls);
        if (exp) setExpenses(exp);
        setLoading(false);
    };

    const handleSaveExpense = async (expenseData: Partial<Expense>) => {
        if (!organizationId) return;

        if (expenseData.id) {
            // Update
            const { error } = await supabase
                .from('expenses')
                .update({
                    title: expenseData.title,
                    amount: expenseData.amount,
                    date: expenseData.date,
                    category: expenseData.category
                })
                .eq('id', expenseData.id);

            if (error) throw error;
        } else {
            // Insert
            const { error } = await supabase
                .from('expenses')
                .insert([{
                    organization_id: organizationId,
                    title: expenseData.title,
                    amount: expenseData.amount,
                    date: expenseData.date,
                    category: expenseData.category
                }]);
            if (error) throw error;
        }
        loadData(); // Reload to refresh list
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            toast.error('Erro ao excluir.');
        }
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setModalOpen(true);
    }

    const openNewModal = () => {
        setEditingExpense(null);
        setModalOpen(true);
    }

    const metrics = useMemo(() => {
        // Filter by date range
        const filteredAppts = appointments.filter(a =>
            isWithinInterval(parseISO(a.date), dateRange)
        );
        const filteredExpenses = expenses.filter(e =>
            isWithinInterval(parseISO(e.date), dateRange)
        );
        const filteredSales = sales.filter(s =>
            isWithinInterval(parseISO(s.created_at), dateRange)
        );

        // Revenue = Appointment service price (if no linked sale) + Sales total_amount
        // To avoid double counting, we'll only use 'sales' for revenue if it exists,
        // or fallback to appointments if there were appointments during the period without sales records.
        // Actually, since all completed appointments now create a sale record via CheckoutModal,
        // we should favor the sales table.
        const appointmentRevenue = filteredAppts
            .filter(a => !sales.some(s => s.appointment_id === a.id))
            .reduce((sum, a) => sum + (a.service?.price || 0), 0);
            
        const salesRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
        
        const revenue = appointmentRevenue + salesRevenue;
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Commissions (Real Data & Grouped)
        const barberCommissions: Record<string, { name: string, total: number, count: number }> = {};
        
        const totalCommissions = filteredAppts.reduce((sum, a) => {
            const amount = Number(a.commission_amount) || 0;
            const barberId = a.barber_id;
            const barberName = a.barber?.name || 'Profissional';

            if (!barberCommissions[barberId]) {
                barberCommissions[barberId] = { name: barberName, total: 0, count: 0 };
            }
            barberCommissions[barberId].total += amount;
            barberCommissions[barberId].count += 1;

            return sum + amount;
        }, 0);

        const netProfit = revenue - totalExpenses - totalCommissions;

        return { 
            revenue, 
            totalExpenses, 
            commissions: totalCommissions, 
            netProfit,
            barberCommissions: Object.values(barberCommissions).sort((a, b) => b.total - a.total)
        };
    }, [appointments, expenses, dateRange, sales]);

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <FeatureGate
            requiredPlan="pro"
            title="Controle Financeiro"
            description="Acompanhe suas receitas, despesas e lucro líquido de forma automatizada. Recurso disponível a partir do plano Pro."
        >
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white">Financeiro</h1>
                        <p className="text-textMuted">Gestão de receitas e despesas.</p>
                    </div>
                    <Button onClick={openNewModal}>
                        <Plus size={16} className="mr-2" />
                        Nova Despesa
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-6 bg-green-500/10 border-green-500/20">
                        <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">Receita Bruta</p>
                        <h3 className="text-2xl font-bold text-white">R$ {metrics.revenue.toFixed(2)}</h3>
                        <TrendingUp className="text-green-500 absolute top-4 right-4 opacity-20" size={40} />
                    </Card>

                    <Card className="p-6 bg-red-500/10 border-red-500/20">
                        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Despesas</p>
                        <h3 className="text-2xl font-bold text-white">R$ {metrics.totalExpenses.toFixed(2)}</h3>
                        <TrendingDown className="text-red-500 absolute top-4 right-4 opacity-20" size={40} />
                    </Card>

                    <Card className="p-6 bg-yellow-500/10 border-yellow-500/20">
                        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1">Comissões</p>
                        <h3 className="text-2xl font-bold text-white">R$ {metrics.commissions.toFixed(2)}</h3>
                        <Users className="text-yellow-500 absolute top-4 right-4 opacity-20" size={40} />
                    </Card>

                    {isAdmin && (
                        <Card className={`p-6 relative overflow-hidden transition-all duration-500 ${metrics.netProfit >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${metrics.netProfit >= 0 ? 'text-primary' : 'text-red-400'}`}>
                                Lucro Líquido
                            </p>
                            <div className="flex items-center gap-2">
                                <h3 className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-white' : 'text-red-500'}`}>
                                    R$ {metrics.netProfit.toFixed(2)}
                                </h3>
                                {metrics.netProfit < 0 && (
                                    <AlertTriangle size={20} className="text-red-500 animate-pulse" />
                                )}
                            </div>
                            <DollarSign className={`absolute top-4 right-4 opacity-20 ${metrics.netProfit >= 0 ? 'text-primary' : 'text-red-500'}`} size={40} />
                        </Card>
                    )}
                </div>

                {/* Commissions Audit Section - ADMIN ONLY */}
                {isAdmin && metrics.barberCommissions.length > 0 && (
                    <Card className="border-yellow-500/10 bg-gradient-to-br from-surface to-yellow-500/[0.02]">
                        <div className="text-yellow-500">
                            <CardHeader 
                                title="Distribuição de Comissões" 
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-[0.2em]">
                                        <th className="px-6 py-4">Profissional</th>
                                        <th className="px-6 py-4">Serviços</th>
                                        <th className="px-6 py-4 text-right">Total Comissão</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {metrics.barberCommissions.map((bc, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold text-xs">
                                                        {bc.name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-white">{bc.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400 text-sm">{bc.count} atendimentos</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-mono font-bold text-yellow-500">R$ {bc.total.toFixed(2)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Expenses List */}
                <Card>
                    <CardHeader title="Despesas Recentes" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10 text-xs text-textMuted uppercase">
                                    <th className="px-6 py-3">Data</th>
                                    <th className="px-6 py-3">Título</th>
                                    <th className="px-6 py-3">Categoria</th>
                                    <th className="px-6 py-3 text-right">Valor</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {expenses.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-4 text-center text-textMuted">Nenhuma despesa registrada.</td></tr>
                                ) : (
                                    expenses.map(e => (
                                        <tr key={e.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-3 text-sm text-gray-300">{format(parseISO(e.date), 'dd/MM/yyyy')}</td>
                                            <td className="px-6 py-3 font-medium text-white">{e.title}</td>
                                            <td className="px-6 py-3 text-sm">
                                                {(() => {
                                                    const colors: Record<string, string> = {
                                                        'Fixo': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                                                        'Variável': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                                                        'Marketing': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                                                        'Manutenção': 'bg-red-500/20 text-red-400 border-red-500/30'
                                                    };
                                                    const style = colors[e.category] || 'bg-white/10 text-zinc-400 border-white/10';
                                                    return (
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style}`}>
                                                            {e.category}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-3 text-right text-red-400 font-mono">- R$ {Number(e.amount).toFixed(2)}</td>
                                            <td className="px-6 py-3 text-right flex justify-end gap-3 transition-all">
                                                <button onClick={() => openEditModal(e)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Editar">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteExpense(e.id)} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all" title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <ExpenseModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setEditingExpense(null); // Clear editing expense when closing
                    }}
                    onSave={handleSaveExpense}
                    expense={editingExpense}
                />
            </div>
        </FeatureGate>
    );
};
