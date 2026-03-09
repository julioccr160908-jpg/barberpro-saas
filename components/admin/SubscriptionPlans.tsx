import React, { useState } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Check, Crown, Zap, Shield, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface PlanConfig {
  id: string;
  name: string;
  price: number;
  staffLimit: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  gradient: string;
}

const PLANS: PlanConfig[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 34.99,
    staffLimit: 3,
    icon: <Shield size={28} />,
    gradient: 'from-blue-500/20 to-blue-600/5',
    features: [
      'Até 3 profissionais',
      'Agendamentos ilimitados',
      'Página de agendamento online',
      'Gestão de clientes',
      'Relatórios básicos',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49.99,
    staffLimit: 6,
    icon: <Zap size={28} />,
    popular: true,
    gradient: 'from-amber-500/20 to-yellow-600/5',
    features: [
      'Até 6 profissionais',
      'Tudo do Básico',
      'Notificações por WhatsApp',
      'Relatórios avançados',
      'Controle financeiro',
      'Programa de fidelidade',
    ],
  },
  {
    id: 'enterprise',
    name: 'Premium',
    price: 74.99,
    staffLimit: 999,
    icon: <Crown size={28} />,
    gradient: 'from-purple-500/20 to-violet-600/5',
    features: [
      'Profissionais ilimitados',
      'Tudo do Pro',
      'Personalização completa',
      'Suporte prioritário',
      'Múltiplas unidades (em breve)',
      'API de integração (em breve)',
    ],
  },
];

export const SubscriptionPlans: React.FC = () => {
  const { organization, refreshOrganization } = useOrganization();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const currentPlan = organization?.planType || 'basic';
  const currentStatus = organization?.subscriptionStatus || 'pending';

  const handleSelectPlan = async (planId: string) => {
    if (!organization || !user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (planId === currentPlan && currentStatus === 'active') {
      toast.info('Você já está neste plano!');
      return;
    }

    setLoading(planId);

    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization.id,
          planType: planId,
          payerEmail: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar assinatura');
      }

      // Redirect user to Mercado Pago checkout
      const checkoutUrl = data.initPoint || data.sandboxInitPoint;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar assinatura');
      console.error('Subscription error:', error);
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'active':
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">✅ Ativo</span>;
      case 'trial':
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">🧪 Período de Teste</span>;
      case 'past_due':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">⚠️ Pagamento Pendente</span>;
      case 'canceled':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">❌ Cancelado</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium">⏳ Pendente</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Planos e Assinatura</h2>
          <p className="text-textMuted mt-1">Escolha o plano ideal para sua barbearia</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
        </div>
      </div>

      {/* Warning for past_due */}
      {currentStatus === 'past_due' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-yellow-400 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-yellow-400 font-medium">Pagamento pendente</p>
            <p className="text-yellow-400/70 text-sm mt-1">
              Sua assinatura está com pagamento pendente. Atualize sua forma de pagamento para evitar interrupções.
            </p>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan && currentStatus === 'active';
          const isUpgrade = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlan);
          const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === currentPlan) && currentStatus === 'active';

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                plan.popular
                  ? 'border-primary/50 shadow-xl shadow-primary/10 scale-[1.02]'
                  : isCurrent
                  ? 'border-green-500/30 shadow-lg shadow-green-500/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-black text-xs font-bold px-3 py-1 rounded-bl-xl">
                  MAIS POPULAR
                </div>
              )}

              {/* Card Content */}
              <div className={`p-6 bg-gradient-to-br ${plan.gradient}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl ${
                    plan.popular ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'
                  }`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-textMuted">R$</span>
                    <span className="text-4xl font-bold text-white">{plan.price.toFixed(2).split('.')[0]}</span>
                    <span className="text-lg text-textMuted">,{plan.price.toFixed(2).split('.')[1]}</span>
                    <span className="text-sm text-textMuted">/mês</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={16} className={`mt-0.5 shrink-0 ${plan.popular ? 'text-primary' : 'text-green-400'}`} />
                      <span className="text-sm text-textMuted">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrent || loading !== null}
                  className={`w-full ${
                    isCurrent
                      ? 'bg-green-600/20 text-green-400 border border-green-500/20 cursor-default'
                      : plan.popular
                      ? 'bg-primary hover:bg-primary/90 text-black font-bold'
                      : isDowngrade
                      ? 'bg-white/5 hover:bg-white/10 text-textMuted border border-white/10'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                >
                  {loading === plan.id ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Processando...</>
                  ) : isCurrent ? (
                    <><Check size={16} className="mr-2" /> Plano Atual</>
                  ) : isDowngrade ? (
                    'Fazer Downgrade'
                  ) : (
                    <><ExternalLink size={16} className="mr-2" /> {isUpgrade ? 'Fazer Upgrade' : 'Assinar'}</>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Plan Details */}
      {currentStatus === 'active' && organization?.mpPayerEmail && (
        <div className="bg-surface rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Detalhes da Assinatura</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-textMuted">Plano</span>
              <p className="text-white font-medium mt-1">{PLANS.find(p => p.id === currentPlan)?.name || currentPlan}</p>
            </div>
            <div>
              <span className="text-textMuted">Email de pagamento</span>
              <p className="text-white font-medium mt-1">{organization.mpPayerEmail}</p>
            </div>
            <div>
              <span className="text-textMuted">Limite de profissionais</span>
              <p className="text-white font-medium mt-1">
                {(organization.staffLimit ?? 3) >= 999 ? 'Ilimitado' : `Até ${organization.staffLimit ?? 3}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
