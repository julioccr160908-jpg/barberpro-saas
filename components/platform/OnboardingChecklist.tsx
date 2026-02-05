import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { CheckCircle2, Circle, ArrowRight, ExternalLink, Calendar, Users, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    link: string;
    linkText: string;
    completed: boolean;
    icon: React.ElementType;
}

export const OnboardingChecklist: React.FC = () => {
    const { user, profile } = useAuth();
    const { organization } = useOrganization();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ChecklistItem[]>([
        {
            id: 'profile',
            label: 'Completar Perfil',
            description: 'Adicione uma foto e confirme seus dados.',
            link: '/admin/settings?tab=profile',
            linkText: 'Editar Perfil',
            completed: false,
            icon: Users
        },
        {
            id: 'schedule',
            label: 'Definir Horários',
            description: 'Configure os dias e horas que a barbearia funciona.',
            link: '/admin/settings',
            linkText: 'Configurar Agenda',
            completed: false,
            icon: Calendar
        },
        {
            id: 'service',
            label: 'Cadastrar Primeiro Serviço',
            description: 'Adicione os cortes ou serviços oferecidos.',
            link: '/admin/services',
            linkText: 'Adicionar Serviço',
            completed: false,
            icon: Scissors
        },
        {
            id: 'share',
            label: 'Divulgar Barbearia',
            description: 'Compartilhe seu link exclusivo.',
            link: `/${organization?.slug || ''}`, // Link para página pública da organização
            linkText: 'Acessar Link Público',
            completed: false,
            icon: ExternalLink
        }
    ]);

    useEffect(() => {
        const checkStatus = async () => {
            if (!profile?.organization_id) {
                setLoading(false);
                return;
            }

            try {
                // 1. Check Services
                const { count: serviceCount } = await supabase
                    .from('services')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', profile.organization_id);

                // 2. Check Schedule (Settings)
                const { data: settings } = await supabase
                    .from('settings')
                    .select('schedule')
                    .eq('organization_id', profile.organization_id)
                    .maybeSingle(); // Changed from single() to avoid 406 on null

                const hasSchedule = settings?.schedule && settings.schedule.length > 0;

                // 3. Check Profile photo (User metadata or Profile table)
                // Using avatarUrl from User interface (camelCase)
                const hasAvatar = !!profile.avatarUrl;

                setItems(prev => prev.map(item => {
                    if (item.id === 'service') return { ...item, completed: (serviceCount || 0) > 0 };
                    if (item.id === 'schedule') return { ...item, completed: !!hasSchedule };
                    if (item.id === 'profile') return { ...item, completed: hasAvatar };
                    if (item.id === 'share') return { ...item, completed: !!organization?.slug };
                    return item;
                }));

            } catch (error) {
                console.error("Error checking onboarding status:", error);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [profile, organization]);

    // Calculate progress
    const completedCount = items.filter(i => i.completed).length;
    const progress = (completedCount / items.length) * 100;

    if (loading) return null; // Or keep a skeleton, but for now silent loading is better than "Carregando..." text
    if (completedCount === items.length) return null; // Hide when done
    return (
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-surface to-surfaceHighlight">
            <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-display font-bold text-white mb-1">
                            Vamos configurar sua Barbearia 🚀
                        </h3>
                        <p className="text-textMuted text-sm">
                            Complete estes passos para deixar tudo pronto para seus clientes.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-background/50 p-2 rounded-lg border border-white/5">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-white">{completedCount} de {items.length}</span>
                            <span className="text-xs text-textMuted">concluídos</span>
                        </div>
                        <div className="w-12 h-12 relative flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-white/10"
                                />
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={125.6}
                                    strokeDashoffset={125.6 - (125.6 * progress) / 100}
                                    className="text-primary transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <span className="absolute text-xs font-bold text-primary">{Math.round(progress)}%</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`
                                p-4 rounded-lg border transition-all duration-300
                                ${item.completed
                                    ? 'bg-green-500/5 border-green-500/20 opacity-75'
                                    : 'bg-surface border-white/10 hover:border-primary/50'
                                }
                            `}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`
                                    mt-1 p-2 rounded-full 
                                    ${item.completed ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}
                                `}>
                                    {item.completed ? <CheckCircle2 size={20} /> : <item.icon size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-medium mb-1 ${item.completed ? 'text-green-400 line-through' : 'text-white'}`}>
                                        {item.label}
                                    </h4>
                                    <p className="text-sm text-textMuted mb-3 leading-relaxed">
                                        {item.description}
                                    </p>

                                    {!item.completed && (
                                        item.id === 'share' ? (
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-sm font-medium text-primary hover:text-primaryLight transition-colors group"
                                            >
                                                {item.linkText}
                                                <ExternalLink size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        ) : (
                                            <Link
                                                to={item.link}
                                                className="inline-flex items-center text-sm font-medium text-primary hover:text-primaryLight transition-colors group"
                                            >
                                                {item.linkText}
                                                <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};
