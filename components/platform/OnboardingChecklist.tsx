import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { CheckCircle2, ArrowRight, ExternalLink, Calendar, Users, Scissors, X } from 'lucide-react';
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

const DISMISS_KEY_PREFIX = 'barberhost_onboarding_dismissed_';

export const OnboardingChecklist: React.FC = () => {
    const { profile } = useAuth();
    const { organization } = useOrganization();
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);
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
            link: `/${organization?.slug || ''}`,
            linkText: 'Acessar Link Público',
            completed: false,
            icon: ExternalLink
        }
    ]);

    // Check if the user has dismissed the checklist before
    useEffect(() => {
        if (organization?.id) {
            const key = DISMISS_KEY_PREFIX + organization.id;
            if (localStorage.getItem(key) === 'true') {
                setDismissed(true);
            }
        }
    }, [organization?.id]);

    useEffect(() => {
        const checkStatus = async () => {
            if (!organization?.id) {
                setLoading(false);
                return;
            }

            try {
                // Run all checks in parallel for performance
                const [servicesRes, settingsRes, appointmentsRes, orgRes] = await Promise.all([
                    // 1. Check Services
                    supabase
                        .from('services')
                        .select('*', { count: 'exact', head: true })
                        .eq('organization_id', organization.id),

                    // 2. Check Schedule (Settings)
                    supabase
                        .from('settings')
                        .select('schedule, establishment_name')
                        .eq('organization_id', organization.id)
                        .maybeSingle(),

                    // 3. Check if org has any appointments (indicator of an established business)
                    supabase
                        .from('appointments')
                        .select('*', { count: 'exact', head: true })
                        .eq('organization_id', organization.id),

                    // 4. Check organization data
                    supabase
                        .from('organizations')
                        .select('slug, name')
                        .eq('id', organization.id)
                        .single()
                ]);

                const serviceCount = servicesRes.count || 0;
                const settings = settingsRes.data;
                const appointmentCount = appointmentsRes.count || 0;
                const org = orgRes.data;

                // If the org already has appointments, it's an established business.
                // Auto-dismiss the checklist and persist so it never shows again.
                if (appointmentCount > 0) {
                    const key = DISMISS_KEY_PREFIX + organization.id;
                    localStorage.setItem(key, 'true');
                    setDismissed(true);
                    setLoading(false);
                    return;
                }

                // Schedule check: consider valid if settings row exists 
                // (even empty schedule means they visited and saved settings)
                const hasSchedule = !!settings;

                // Profile check: avatar OR name filled (either means they engaged with profile)
                const hasProfile = !!profile?.avatarUrl || !!profile?.phone;

                // Service check
                const hasServices = serviceCount > 0;

                // Share check: org has a non-empty slug AND name
                const hasSlug = !!(org?.slug && org.slug.trim().length > 0);

                setItems(prev => prev.map(item => {
                    if (item.id === 'service') return { ...item, completed: hasServices };
                    if (item.id === 'schedule') return { ...item, completed: hasSchedule };
                    if (item.id === 'profile') return { ...item, completed: hasProfile };
                    if (item.id === 'share') return { ...item, completed: hasSlug };
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

    // Handle dismiss
    const handleDismiss = useCallback(() => {
        if (organization?.id) {
            const key = DISMISS_KEY_PREFIX + organization.id;
            localStorage.setItem(key, 'true');
        }
        setDismissed(true);
    }, [organization?.id]);

    // Calculate progress
    const completedCount = items.filter(i => i.completed).length;
    const progress = (completedCount / items.length) * 100;

    // Don't show if loading, dismissed, or all completed
    if (loading) return null;
    if (dismissed) return null;
    if (completedCount === items.length) {
        // All done — auto-dismiss permanently
        if (organization?.id) {
            const key = DISMISS_KEY_PREFIX + organization.id;
            localStorage.setItem(key, 'true');
        }
        return null;
    }

    return (
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-surface to-surfaceHighlight relative">
            {/* Dismiss Button */}
            <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1.5 rounded-full text-textMuted hover:text-white hover:bg-white/10 transition-colors z-10"
                title="Dispensar tutorial"
            >
                <X size={18} />
            </button>

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
