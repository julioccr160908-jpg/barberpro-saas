
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Phone, Mail, Loader2, Save } from 'lucide-react';

export const CustomerProfile: React.FC = () => {
    const { user, role } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar_url: ''
    });

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '', // Needs phone column in DB
                    avatar_url: data.avatar_url || ''
                });
            }
        } catch (error) {
            console.error("Error loading profile", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        if (value.length > 9) value = `${value.slice(0, 9)}-${value.slice(9)}`;
        setFormData({ ...formData, phone: value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    // Email update is complex in Supabase (requires re-confirm), let's skip for now or use specific flow
                })
                .eq('id', user?.id);

            if (error) throw error;
            setMessage('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error("Error updating profile", error);
            setMessage('Erro ao atualizar perfil.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Meu Perfil</h2>

            <Card>
                <form onSubmit={handleSave} className="space-y-6">

                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-surfaceHighlight border-2 border-primary p-1 overflow-hidden">
                            <img
                                src={formData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.name}`}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                    </div>

                    <Input
                        label="Nome Completo"
                        icon={<User size={18} />}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="E-mail"
                        icon={<Mail size={18} />}
                        name="email"
                        value={formData.email}
                        disabled
                        className="opacity-50 cursor-not-allowed" // Visually indicate disabled
                    />

                    <Input
                        label="Celular / WhatsApp"
                        icon={<Phone size={18} />}
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="(00) 00000-0000"
                    />

                    {message && (
                        <div className={`p-3 rounded-lg text-center text-sm font-medium ${message.includes('sucesso') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {message}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
