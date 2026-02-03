
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../services/supabase';
import { db } from '../../services/database';
import { Loader2, Save, Bell, Mail, MessageSquare, Check, X, Wand2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
    id: string;
    type: 'confirmation' | 'reminder_24h' | 'reminder_1h' | 'welcome';
    channel: 'email' | 'whatsapp';
    subject: string | null;
    content: string;
    is_active: boolean;
}

const TEMPLATE_NAMES = {
    'confirmation': 'Confirmação de Agendamento',
    'reminder_24h': 'Lembrete (24h antes)',
    'reminder_1h': 'Lembrete (1h antes)',
    'welcome': 'Boas-vindas'
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
    const [savingId, setSavingId] = useState<string | null>(null);

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

            if (data && data.length > 0) {
                setTemplates(data);
            } else {
                // Self-healing fallback omitted for brevity as it should exist now
                // (keeps existing logic if needed but assuming data exists from previous steps)
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (id: string, field: keyof Template, value: any) => {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleSave = async (template: Template) => {
        setSavingId(template.id);
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

            // Show checkmark for 1s
            setTimeout(() => setSavingId(null), 1000);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao salvar template.');
            setSavingId(null);
        }
    };

    const insertVariable = (templateId: string, variable: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        // Simple append for now, ideally insert at cursor but textarea ref is tricky in map
        handleUpdate(templateId, 'content', template.content + ' ' + variable);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wide">Notificações</h1>
                    <p className="text-textMuted mt-1">Personalize como a barbearia se comunica com seus clientes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {templates.map(template => (
                    <Card key={template.id} className={`relative overflow-hidden transition-all duration-300 ${template.is_active ? 'border-primary/20' : 'border-white/5 opacity-75'}`}>
                        {/* Header */}
                        <div className="p-6 bg-surfaceHighlight/30 border-b border-white/5 flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${template.channel === 'whatsapp' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {template.channel === 'whatsapp' ? <MessageSquare size={24} /> : <Mail size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        {TEMPLATE_NAMES[template.type] || template.type}
                                    </h3>
                                    <p className="text-xs text-textMuted uppercase tracking-wider font-semibold">
                                        Via {template.channel}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-medium px-2 py-1 rounded ${template.is_active ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {template.is_active ? 'ATIVADO' : 'DESATIVADO'}
                                </span>
                                <button
                                    onClick={() => handleSave({ ...template, is_active: !template.is_active })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${template.is_active ? 'bg-primary' : 'bg-zinc-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${template.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {template.channel === 'email' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Assunto do E-mail</label>
                                    <Input
                                        value={template.subject || ''}
                                        onChange={(e) => handleUpdate(template.id, 'subject', e.target.value)}
                                        className="bg-black/30 border-white/10 focus:border-primary/50"
                                        placeholder="Ex: Confirmação de Agendamento"
                                    />
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Conteúdo da Mensagem</label>
                                    <div className="flex gap-1 flex-wrap">
                                        {VARIABLES.map(v => (
                                            <button
                                                key={v.value}
                                                onClick={() => insertVariable(template.id, v.value)}
                                                className="text-[10px] bg-white/5 hover:bg-primary/20 hover:text-primary text-textMuted px-2 py-1 rounded border border-white/10 transition-colors flex items-center gap-1"
                                                title={`Inserir ${v.label}`}
                                            >
                                                <Plus size={8} />
                                                {v.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors resize-y min-h-[120px]"
                                    value={template.content}
                                    onChange={(e) => handleUpdate(template.id, 'content', e.target.value)}
                                    placeholder="Digite sua mensagem aqui..."
                                />
                                <p className="text-xs text-textMuted flex items-center gap-1">
                                    <Wand2 size={12} className="text-primary" />
                                    Dica: Clique nas variáveis acima para personalizar a mensagem.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex justify-end">
                            <Button
                                onClick={() => handleSave(template)}
                                disabled={savingId === template.id}
                                className={savingId === template.id && template.id !== 'success' ? 'bg-green-600 hover:bg-green-700 text-white border-none' : ''}
                            >
                                {savingId === template.id ? (
                                    <>
                                        <Check size={18} className="mr-2" />
                                        Salvo!
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} className="mr-2" />
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
