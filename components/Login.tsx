
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Phone, User, ArrowRight, Scissors, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Role } from '../types';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') || 'customer';
  const isAdmin = roleParam === 'admin';

  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');

  const handleSmartRedirect = async (userId: string) => {
    try {
      const { data: lastAppt } = await supabase
        .from('appointments')
        .select('organization_id')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastAppt?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('slug')
          .eq('id', lastAppt.organization_id)
          .single();

        if (org?.slug) {
          navigate(`/${org.slug}`);
          return;
        }
      }
    } catch (e) {
      console.log("Error finding smart redirect:", e);
    }
    navigate('/book');
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password
    });

    if (error) throw error;

    if (data.user) {
      // Check Profile Role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const userRole = profile?.role || Role.CUSTOMER;

      console.log("LOGIN DEBUG:", {
        authId: data.user.id,
        profileData: profile,
        resolvedRole: userRole,
        isAdminParam: isAdmin
      });

      // SEMPRE redirecionar baseado na role do perfil, não no parâmetro URL
      if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
        // Admin e Super Admin SEMPRE vão para o painel admin
        navigate('/admin/dashboard');
      } else if (userRole === Role.BARBER) {
        // Barbeiro vai para agenda
        navigate('/admin/schedule');
      } else {
        // Customer Flow
        const redirect = searchParams.get('redirect');
        if (redirect) {
          navigate(redirect);
        } else {
          await handleSmartRedirect(data.user.id);
        }
      }
    }
  };


  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      throw new Error('As senhas não coincidem.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          full_name: formData.name,
          phone: formData.phone
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      toast.success('Conta criada com sucesso!');
      // Assuming auto-login, redirect
      navigate('/book');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering && !isAdmin) {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message;
      if (msg.includes('Invalid login credentials')) msg = 'E-mail ou senha inválidos.';
      setError(msg || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 9) value = `${value.slice(0, 9)}-${value.slice(9)}`;
    setFormData({ ...formData, phone: value });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 blur-sm"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/80"></div>
      </div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface border border-primary/30 mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Scissors size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wider mb-2">
            {isAdmin ? 'BEM-VINDO' : (isRegistering ? 'CRIE SUA CONTA' : 'BEM-VINDO')}
          </h1>
          <p className="text-textMuted">
            {isAdmin ? 'Acesso Administrativo Seguro' : (isRegistering ? 'Preencha seus dados para começar' : 'Acesse para agendar seu horário')}
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-surface/90 border-border/50">
          <form onSubmit={handleSubmit} className="space-y-6">

            {isAdmin ? (
              // Admin Form Fields
              <>
                <Input
                  label="E-mail Administrativo"
                  placeholder="admin@barberhost.com"
                  icon={<Mail size={18} />}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  type="email"
                />

                <Input
                  label="Senha"
                  placeholder="••••••••"
                  icon={<Lock size={18} />}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  type={showPassword ? 'text' : 'password'}
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-textMuted hover:text-white transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </>
            ) : (
              // Customer Form Fields
              <div className="space-y-4">
                {isRegistering && (
                  <Input
                    label="Nome Completo"
                    placeholder="Ex: João da Silva"
                    icon={<User size={18} />}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                )}

                <Input
                  label="E-mail (Gmail)"
                  placeholder="seu.email@gmail.com"
                  icon={<Mail size={18} />}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  type="email"
                />

                {isRegistering && (
                  <Input
                    label="Celular / WhatsApp"
                    placeholder="(00) 00000-0000"
                    icon={<Phone size={18} />}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    required
                    type="tel"
                  />
                )}

                <Input
                  label="Senha"
                  placeholder="••••••••"
                  icon={<Lock size={18} />}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  type={showPassword ? 'text' : 'password'}
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-textMuted hover:text-white transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />

                {isRegistering && (
                  <Input
                    label="Confirmar Senha"
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    type={showPassword ? 'text' : 'password'}
                  />
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-xs text-center font-medium animate-pulse">
                {error}
              </div>
            )}

            <Button fullWidth size="lg" type="submit" className="mt-2 group" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : null}
              {isAdmin ? 'Entrar no Painel' : (isRegistering ? 'Criar Conta' : 'Entrar')}
              {!loading && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            {isAdmin ? (
              <>
                <p className="text-xs text-textMuted">
                  Esqueceu a senha? <a href="#" className="text-primary hover:underline">Contate o suporte</a>.
                </p>
                <div className="pt-4 border-t border-white/10 mt-4">
                  <p className="text-sm text-textMuted">
                    Quer usar o BarberHost? <Link to="/register" className="text-primary font-medium hover:underline">Cadastrar minha Barbearia</Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setIsRegistering(!isRegistering);
                    }}
                    className="text-sm text-textMuted hover:text-white transition-colors"
                  >
                    {isRegistering
                      ? <span>Já tem uma conta? <span className="text-primary font-medium hover:underline">Faça Login</span></span>
                      : <span>Não tem cadastro? <span className="text-primary font-medium hover:underline">Cadastre-se aqui</span></span>
                    }
                  </button>
                </div>
                {!isRegistering && (
                  <p className="text-xs text-textMuted">
                    Ao continuar, você concorda com nossos <a href="#" className="text-primary hover:underline">Termos de Uso</a>.
                  </p>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Quick Role Switch for Demo */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setError('');
              setFormData({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
              setIsRegistering(false);
              navigate(isAdmin ? '/login?role=customer' : '/login?role=admin');
            }}
            className="text-sm text-textMuted hover:text-white transition-colors"
          >
            {isAdmin ? '← Voltar para Área do Cliente' : 'Acesso Restrito (Admin)'}
          </button>
        </div>
      </div>
    </div>
  );
};
