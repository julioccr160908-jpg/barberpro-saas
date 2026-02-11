import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../services/supabase';
import { db } from '../../services/database';
import { Loader2, Save, Mail, MessageSquare, Check, Wand2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
    id: string;
    type: 'confirmation' | 'reminder_24h' | 'reminder_1h' | 'welcome' | 'cancelled';
    channel: 'email' | 'whatsapp';
    subject: string | null;
    content: string;
    is_active: boolean;
}

const TEMPLATE_NAMES: Record<string, string> = {
    'confirmation': 'Confirmação de Agendamento',
    'reminder_24h': 'Lembrete (24h antes)',
    'reminder_1h': 'Lembrete (1h antes)',
    'welcome': 'Boas-vindas',
    'cancelled': 'Cancelamento'
};

const VARIABLES = [
    { label: 'Nome do Cliente', value: '{customer_name}' },
    { label: 'Nome do Serviço', value: '{service_name}' },
    { label: 'Data e Hora', value: '{date_time}' },
    { label: 'Hora', value: '{time}' },
    { label: 'Nome da Barbearia', value: '{establishment_name}' },
];

export const AdminNotificationSettings: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingIds, setSavingIds] = useState<string[]>([]);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const org = await db.organizations.get();
            if (!org) return;

            const { data, error } = await supabase
                .from('notification_templates')
                .select('*')
                .eq('organization_id', org.id)
                .order('channel')
                .order('type');

            if (data) {
                setTemplates(data as Template[]);
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar templates');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (id: string, field: keyof Template, value: any) => {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleSave = async (template: Template) => {
        setSavingIds(prev => [...prev, template.id]);
        try {
            const { error } = await supabase
                .from('notification_templates')
                .update({
                    subject: template.subject,
                    content: template.content,
                    is_active: template.is_active
                })
                .eq('id', template.id);

            if (error) throw error;

            toast.success('Alterações salvas!');
            setTimeout(() => {
                setSavingIds(prev => prev.filter(id => id !== template.id));
            }, 2000);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao salvar template.');
            setSavingIds(prev => prev.filter(id => id !== template.id));
        }
    };

    const insertVariable = (templateId: string, variable: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;
        handleUpdate(templateId, 'content', template.content + ' ' + variable);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    // Group templates by type
    const grouped = templates.reduce((acc, t) => {
        const type = t.type;
        if (!acc[type]) acc[type] = {};
        acc[type][t.channel] = t;
        return acc;
    }, {} as Record<string, { email?: Template, whatsapp?: Template }>);

    const renderChannelSection = (template: Template | undefined, channel: 'email' | 'whatsapp') => {
        if (!template) return (
            <div className="p-6 text-center text-textMuted italic">
                Template de {channel} não encontrado.
            </div>
        );

        const isSaving = savingIds.includes(template.id);

        return (
            <div className={`p-6 space-y-6 ${!template.is_active ? 'opacity-80' : ''}`}>
                {/* Header: Toggle & Icon */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${channel === 'whatsapp' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {channel === 'whatsapp' ? <MessageSquare size={18} /> : <Mail size={18} />}
                        </div>
                        <span className="font-medium text-white uppercase text-sm tracking-wide">
                            Via {channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                        </span>
                    </div>

                    <button
                        onClick={() => {
                            const newValue = !template.is_active;
                            handleUpdate(template.id, 'is_active', newValue);
                            handleSave({ ...template, is_active: newValue });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${template.is_active ? 'bg-primary' : 'bg-zinc-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${template.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* Editor */}
                <div className="space-y-4">
                    {channel === 'email' && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Assunto</label>
                            <Input
                                value={template.subject || ''}
                                onChange={(e) => handleUpdate(template.id, 'subject', e.target.value)}
                                className="bg-black/20 border-white/10 h-9 text-sm"
                                placeholder="Assunto do e-mail"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Mensagem</label>
                            <div className="flex flex-wrap gap-1 justify-end">
                                {VARIABLES.map(v => (
                                    <button
                                        key={v.value}
                                        onClick={() => insertVariable(template.id, v.value)}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-textMuted hover:text-white border border-white/5 transition-colors"
                                        title={`Inserir ${v.label}`}
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors resize-y min-h-[120px]"
                            value={template.content}
                            onChange={(e) => handleUpdate(template.id, 'content', e.target.value)}
                            placeholder="Digite sua mensagem..."
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={() => handleSave(template)}
                            disabled={isSaving}
                            variant="ghost"
                            size="sm"
                            className={isSaving ? 'text-green-400' : 'text-textMuted hover:text-white'}
                        >
                            {isSaving ? (
                                <><Check size={14} className="mr-1.5" /> Salvo</>
                            ) : (
                                <><Save size={14} className="mr-1.5" /> Salvar Conteúdo</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wide">Notificações</h1>
                    <p className="text-textMuted mt-1">Configure as mensagens automáticas enviadas aos clientes.</p>
                </div>
            </div>

            <div className="space-y-8">
                {Object.entries(TEMPLATE_NAMES).map(([type, label]) => {
                    const group = grouped[type];
                    if (!group) return null; // Should not happen given seed

                    // Check if any active in group to highlight card?
                    const anyActive = group.email?.is_active || group.whatsapp?.is_active;

                    return (
                        <Card key={type} className={`overflow-hidden transition-all duration-300 ${anyActive ? 'border-primary/10' : 'border-white/5 opacity-75 hover:opacity-100'}`}>
                            <div className="px-6 py-4 bg-surfaceHighlight/20 border-b border-white/5 flex items-center gap-3">
                                <h2 className="text-lg font-bold text-white">{label}</h2>
                            </div>

                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5 bg-black/20">
                                <div className="flex-1">
                                    {renderChannelSection(group.email, 'email')}
                                </div>
                                <div className="flex-1">
                                    {renderChannelSection(group.whatsapp, 'whatsapp')}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
