import React from 'react';
import { Card, CardHeader } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { useOrganization } from '../hooks/useOrganization';
import { DollarSign, Users, CalendarCheck, TrendingUp, ExternalLink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { parseISO, format } from 'date-fns';
import { useAdminStats } from '../hooks/useAdminStats';
import { OnboardingChecklist } from './platform/OnboardingChecklist';
import { AppointmentStatus } from '../types';

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
  const { profile, loading: authLoading } = useAuth();
  const { data: organization } = useOrganization();

  // Use the new hook for data fetching and aggregation
  const {
    revenue,
    count,
    uniqueCustomers,
    isLoading: statsLoading,
    upcomingAppointments,
    chartData
  } = useAdminStats(profile?.organization_id);

  const loading = authLoading || statsLoading;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 lg:col-span-1 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase">Dashboard</h1>
          <p className="text-textMuted">Visão geral do desempenho</p>
        </div>

        {/* Public Link Button */}
        {organization?.slug && (
          <a
            href={`/${organization.slug}`}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-lg hover:border-primary/50 transition-colors text-sm font-medium text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Ver Loja Online</span>
            <ExternalLink size={16} className="text-primary" />
          </a>
        )}
      </div>

      <OnboardingChecklist />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Realizada"
          value={revenue > 0 ? `R$ ${revenue.toFixed(2)}` : 'R$ 0,00'}
          trend={revenue > 0 ? "Total acumulado" : "Sem dados"}
          icon={DollarSign}
        />
        <StatCard
          title="Agendamentos"
          value={count > 0 ? count.toString() : '0'}
          trend={count > 0 ? "Total ativos" : "Sem agendamentos"}
          icon={CalendarCheck}
        />
        <StatCard
          title="Clientes Únicos"
          value={uniqueCustomers > 0 ? uniqueCustomers.toString() : '0'}
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
              {revenue === 0 ? (
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
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {upcomingAppointments.length === 0 ? (
                <div className="text-textMuted text-center mt-10">Nenhum agendamento futuro.</div>
              ) : (
                upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/50 hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded bg-surfaceHighlight text-primary font-bold font-display">
                      <span className="text-sm">{format(parseISO(appt.date), 'HH:mm')}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{appt.customer?.name || appt.customer_id || 'Cliente'}</p>
                      <p className="text-xs text-textMuted">{appt.service?.name || 'Serviço'} • {format(parseISO(appt.date), 'dd/MM')}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${appt.status === AppointmentStatus.CONFIRMED ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
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