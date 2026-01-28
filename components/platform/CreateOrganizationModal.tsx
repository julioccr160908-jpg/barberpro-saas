
import React, { useState, useEffect } from 'react';
import { X, Building2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase'; // Adjust path if needed
import { Button } from '../ui/Button'; // Adjust path
import { Input } from '../ui/Input'; // Adjust path
import { useAuth } from '../../contexts/AuthContext';

interface CreateOrganizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName('');
            setSlug('');
            setError('');
        }
    }, [isOpen]);

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        // Simple slugify: lowercase, replace spaces with hyphens, remove special chars
        const newSlug = newName
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
        setSlug(newSlug);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !slug) return;
        setLoading(true);
        setError('');

        try {
            const { data, error: insertError } = await supabase
                .from('organizations')
                .insert([
                    {
                        name,
                        slug,
                        owner_id: user?.id, // Default to current user (Super Admin) as owner initially
                        subscription_status: 'trial',
                        plan_type: 'basic'
                    }
                ])
                .select()
                .single();

            if (insertError) throw insertError;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error creating organization:', err);
            if (err.code === '23505') { // Unique violation
                setError('Este slug já está em uso. Por favor escolha outro.');
            } else {
                setError(err.message || 'Erro ao criar barbearia.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-xl animate-fade-in relative">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Building2 className="text-primary" size={24} />
                        Nova Barbearia
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <Input
                        label="Nome da Barbearia"
                        value={name}
                        onChange={handleNameChange}
                        placeholder="Ex: Barbearia do Zé"
                        required
                        icon={<Building2 size={18} />}
                    />

                    <div className="space-y-1">
                        <Input
                            label="URL Amigável (Slug)"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="ex: barbearia-do-ze"
                            required
                            icon={<LinkIcon size={18} />}
                        />
                        <p className="text-xs text-zinc-500 pl-1">
                            Endereço final: barberpro.com/{slug || '...'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? 'Criando...' : 'Criar Barbearia'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
