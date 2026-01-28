
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Phone, User, Building2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1); // 1: User Info, 2: Barbershop Info
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        orgName: '',
        orgSlug: ''
    });

    const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

        setFormData(prev => ({ ...prev, orgName: name, orgSlug: slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Register.tsx: Starting registration for', formData.email);

            // 1. Sign Up User with Timeout
            const signUpPromise = supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        phone: formData.phone
                    }
                }
            });

            const signUpTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout ao criar conta (20s). Verifique sua conexão.')), 20000)
            );

            console.log('Register.tsx: Calling supabase.auth.signUp');
            const { data: authData, error: authError } = await Promise.race([signUpPromise, signUpTimeout]) as any;

            if (authError) {
                console.error('Register.tsx: Auth Error', authError);
                throw authError; // Supabase error often has a .message property
            }

            console.log('Register.tsx: Auth Success', authData.user?.id);

            if (authData.user) {
                // 2. Call RPC to create Pending Organization with Timeout
                console.log('Register.tsx: Calling generate_pending_organization RPC');

                const rpcPromise = supabase.rpc('create_pending_organization', {
                    org_name: formData.orgName,
                    org_slug: formData.orgSlug
                });

                const rpcTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout ao criar barbearia (15s).')), 15000)
                );

                const { error: rpcError } = await Promise.race([rpcPromise, rpcTimeout]) as any;

                if (rpcError) {
                    console.error('Register.tsx: RPC Error', rpcError);
                    // If RPC fails, we might want to warn the user but the account is created. 
                    // ideally we should rollback or manual fix, but for now just error out.
                    throw new Error('Conta criada, mas erro ao registrar barbearia: ' + rpcError.message);
                }

                console.log('Register.tsx: RPC Success');
                // Success
                navigate('/register-success');
            }

        } catch (err: any) {
            console.error('Registration Exception:', err);
            setError(err.message || 'Erro desconhecido ao processar cadastro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-20 blur-sm"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/80"></div>
            </div>

            <div className="w-full max-w-md z-10 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface border border-primary/30 mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                        <Building2 size={32} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-wider mb-2">
                        NOVA BARBEARIA
                    </h1>
                    <p className="text-textMuted">
                        Solicite o cadastro do seu negócio
                    </p>
                </div>

                <Card className="backdrop-blur-sm bg-surface/90 border-border/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-sm">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {step === 1 ? (
                            <div className="space-y-4 animate-slide-in">
                                <h3 className="text-white font-medium border-b border-white/10 pb-2">1. Seus Dados</h3>
                                <Input
                                    label="Nome Completo"
                                    required
                                    icon={<User size={18} />}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <Input
                                    label="E-mail"
                                    type="email"
                                    required
                                    icon={<Mail size={18} />}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                                <Input
                                    label="Senha"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    icon={<Lock size={18} />}
                                    endIcon={
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-zinc-500">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    }
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <Input
                                    label="Celular"
                                    placeholder="(00) 00000-0000"
                                    required
                                    icon={<Phone size={18} />}
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <Button type="button" onClick={() => setStep(2)} className="w-full">
                                    Próximo
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-slide-in">
                                <h3 className="text-white font-medium border-b border-white/10 pb-2">2. Dados da Barbearia</h3>
                                <Input
                                    label="Nome da Barbearia"
                                    placeholder="Ex: Corte Chique"
                                    required
                                    icon={<Building2 size={18} />}
                                    value={formData.orgName}
                                    onChange={handleOrgNameChange}
                                />
                                <div className="space-y-1">
                                    <Input
                                        label="Link Personalizado (Slug)"
                                        value={formData.orgSlug}
                                        readOnly
                                        className="opacity-75"
                                        icon={<Building2 size={18} />}
                                    />
                                    <p className="text-xs text-zinc-500">barberpro.com/{formData.orgSlug}</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                                        Voltar
                                    </Button>
                                    <Button type="submit" disabled={loading} className="flex-1">
                                        {loading ? 'Enviando...' : 'Finalizar Solicitação'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="text-center pt-2">
                            <Link to="/login" className="text-primary text-sm hover:underline">
                                Já tem conta? Fazer Login
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};
