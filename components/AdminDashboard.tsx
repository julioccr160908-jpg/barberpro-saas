import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader } from './ui/Card';
import { DollarSign, Users, CalendarCheck, TrendingUp, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../services/supabase';
import { AppointmentStatus, User } from '../types';
import { format, isToday, isSameDay, subDays, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatCard: React.FC<{
  title: string;
  value: string;
  trend?: string;
  icon: React.ElementType;
  isPositive?: boolean
}> = ({ title, value, trend, icon: Icon, isPositive = true }) => (
  <Card className="bg-surface relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon size={64} />
    </div>
    <div className="relative z-10">
      <p className="text-textMuted text-xs uppercase tracking-wider font-semibold mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-white mb-2">{value}</h4>
      {trend && (
        <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          <TrendingUp size={12} className="mr-1" />
          {trend}
        </div>
      )}
    </div>
  </Card>
);

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [period, setPeriod] = useState('Esta Semana');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch appointments with relations
      // Note: We use raw supabase client here for joins which are essential for dashboard analytics
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customer_id(name),
          barber:barber_id(name),
          service:service_id(name, price)
        `)
        .order('date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    if (!appointments.length) {
      return {
        revenue: 0,
        count: 0,
        uniqueCustomers: 0,
        occupancy: 0
      };
    }

    // Filter valid appointments (not cancelled)
    const validAppts = appointments.filter(a => a.status !== 'CANCELLED');

    // Revenue: APENAS agendamentos COMPLETED (cortes já realizados)
    const completedAppts = appointments.filter(a => a.status === 'COMPLETED');
    const revenue = completedAppts.reduce((sum, appt) => sum + (appt.service?.price || 0), 0);

    // Count: Total de agendamentos ativos (não cancelados)
    const count = validAppts.length;

    // Unique Customers: Baseado em agendamentos completados
    const uniqueCustomers = new Set(completedAppts.map(a => a.customer_id)).size;

    return {
      revenue,
      count,
      uniqueCustomers,
      occupancy: 0 // occupancy calculation implies knowing total slots, which is complex. Leaving 0 for now or removing.
    };
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(a => new Date(a.date) >= now && a.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5); // Take next 5
  }, [appointments]);

  const chartData = useMemo(() => {
    if (!appointments.length) return [];

    // Generate last 7 days data
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      days.push(d);
    }

    return days.map(day => {
      // APENAS cortes COMPLETED (já realizados)
      const dayRevenue = appointments
        .filter(a => isSameDay(new Date(a.date), day) && a.status === 'COMPLETED')
        .reduce((sum, a) => sum + (a.service?.price || 0), 0);

      return {
        name: format(day, 'EEE', { locale: ptBR }), // Seg, Ter...
        value: dayRevenue,
        fullDate: format(day, 'dd/MM/yyyy')
      };
    });
  }, [appointments]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase">Dashboard</h1>
          <p className="text-textMuted">Visão geral do desempenho</p>
        </div>
        <div className="flex gap-2">
          {/* Filter UI - Currently visual only, logic filters 'All time' fetched data or we could refine fetch */}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Realizada"
          value={metrics.revenue > 0 ? `R$ ${metrics.revenue.toFixed(2)}` : 'R$ 0,00'}
          trend={metrics.revenue > 0 ? "Total acumulado" : "Sem dados"}
          icon={DollarSign}
        />
        <StatCard
          title="Agendamentos"
          value={metrics.count > 0 ? metrics.count.toString() : '0'}
          trend={metrics.count > 0 ? "Total ativos" : "Sem agendamentos"}
          icon={CalendarCheck}
        />
        <StatCard
          title="Clientes Únicos"
          value={metrics.uniqueCustomers > 0 ? metrics.uniqueCustomers.toString() : '0'}
          trend="Total atendidos"
          icon={Users}
        />
        <StatCard
          title="Ocupação Hoje"
          value="-"
          trend="Não disponível"
          icon={TrendingUp}
          isPositive={false}
        />
      </div>

      {/* Main Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <Card className="h-96">
            <CardHeader title="Receita (Últimos 7 dias)" subtitle="Baseado em cortes realizados" />
            <div className="h-72 w-full">
              {metrics.revenue === 0 ? (
                <div className="h-full flex items-center justify-center text-textMuted">Sem dados financeiros para exibir</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#666"
                      tick={{ fill: '#666', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#666"
                      tick={{ fill: '#666', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#fff' }}
                      itemStyle={{ color: '#D4AF37' }}
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                      labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#D4AF37"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity / Side Panel */}
        <div className="lg:col-span-1">
          <Card className="h-96 flex flex-col">
            <CardHeader title="Próximos Cortes" subtitle="Agendados" />
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {upcomingAppointments.length === 0 ? (
                <div className="text-textMuted text-center mt-10">Nenhum agendamento futuro.</div>
              ) : (
                upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/50 hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded bg-surfaceHighlight text-primary font-bold font-display">
                      <span className="text-sm">{format(parseISO(appt.date), 'HH:mm')}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{appt.customer?.name || 'Cliente'}</p>
                      <p className="text-xs text-textMuted">{appt.service?.name || 'Serviço'} • {format(parseISO(appt.date), 'dd/MM')}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${appt.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};