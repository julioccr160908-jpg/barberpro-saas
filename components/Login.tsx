
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Phone, User, ArrowRight, Scissors, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { db } from '../services/database';
import { Role } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'customer';
  const isAdmin = role === 'admin';

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
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      // Admin Authentication Logic (Mocked for now, or could use Supabase if admin user exists)
      if (isAdmin) {
        // Timeout Promise
        // Tentar Login Real Direto (Sem Wrapper de Timeout Customizado)
        console.log("Tentando login de Admin...");
        console.log("URL Supabase:", import.meta.env.VITE_SUPABASE_URL);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (!authError && authData?.user) {
          navigate('/admin/dashboard');
          return; // Sucesso
        }

        // Se falhar e forem as credenciais "Mestres", criar o usuário automaticamente (Migração)
        if ((formData.email === 'julioccr1609@gmail.com' && formData.password === 'Julioccr2020') || (formData.email === 'julio10@gmail.com' && formData.password === '123456')) {
          console.log("Migrando Admin Master...");
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password
          });

          if (signUpError) throw signUpError;

          if (signUpData.user) {
            // Criar Perfil Admin
            await supabase.from('profiles').upsert([{
              id: signUpData.user.id,
              name: 'Admin Master',
              email: formData.email,
              role: Role.ADMIN,
              avatar_url: 'https://github.com/shadcn.png',
              job_title: 'Dono'
            }]);
            navigate('/admin/dashboard');
            return;
          }
        }

        // Se chegou aqui, é erro normal de login
        setError('Acesso negado. E-mail ou senha incorretos.');
      } else {
        // Customer Auth Logic
        if (isRegistering) {
          // REGISTRATION
          if (formData.password !== formData.confirmPassword) {
            throw new Error('As senhas não coincidem.');
          }


          // Chamada de registro direta
          const { data: authData, error: authError } = await supabase.auth.signUp({
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

          if (authError) throw authError;

          if (authData?.user) {
            setInfoMessage('Conta criada com sucesso! Redirecionando...');

            // Pequeno delay para o usuário ver a mensagem de sucesso
            setTimeout(() => {
              navigate('/book');
            }, 1000);
            return;
          }

        } else {
          // LOGIN
          console.log("Login.tsx: Auth Start for", formData.email);
          console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);

          // Define login promise
          const loginPromise = supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
          });

          // Define timeout promise (15 seconds)
          const loginTimeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite de conexão excedido. Verifique sua internet ou se o servidor está rodando.')), 15000)
          );

          // Race them
          const { data, error: authError } = await Promise.race([loginPromise, loginTimeoutPromise]) as any;

          console.log("Login.tsx: Auth Done", { user: data?.user?.id, error: authError });

          if (authError) {
            if (authError.message.includes('Invalid login credentials')) {
              setError('E-mail ou senha inválidos.');
            } else {
              setError(authError.message);
            }
            return; // Stop here if auth failed
          }

          if (data.user) {
            console.log("Login.tsx: Fetching Profile...");

            // Timeout for profile fetch
            const profilePromise = supabase
              .from('profiles')
              .select('role')
              .eq('id', data.user.id)
              .single();

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
            );

            try {
              const result: any = await Promise.race([profilePromise, timeoutPromise]);
              const profile = result.data;
              const profileError = result.error;

              console.log("Login.tsx: Profile Fetched", { role: profile?.role, error: profileError });

              if (profileError) {
                console.error('Error fetching profile:', profileError);
                // Fallback?
              }

              const role = profile?.role || Role.CUSTOMER; // Default to Customer if fail

              if (role === Role.ADMIN) {
                navigate('/admin/dashboard');
              } else if (role === Role.BARBER) {
                navigate('/admin/schedule'); // Barber view
              } else {
                // Customer
                const redirect = searchParams.get('redirect');
                navigate(redirect || '/book');
              }
            } catch (err) {
              console.error("Login.tsx: Profile Fetch Exception", err);
              // Fallback to customer on error to avoid lock
              navigate('/book');
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Login Error Catch:", err);
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      console.log("Login Finally Block Reached");
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Simple mask for phone number (00) 00000-0000
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
                  placeholder="admin@barberpro.com"
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
                    required // Optional: make required only if strict
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
                {!isRegistering && error.includes('cadastre-se') && (
                  <button
                    type="button"
                    onClick={() => { setError(''); setIsRegistering(true); }}
                    className="block w-full mt-2 text-primary hover:underline font-bold"
                  >
                    Criar conta agora
                  </button>
                )}
              </div>
            )}

            {/* Info Message */}
            {infoMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-500 text-xs text-center font-medium">
                {infoMessage}
              </div>
            )}

            <Button fullWidth size="lg" type="submit" className="mt-2 group" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : null}
              {isAdmin ? 'Entrar no Painel' : (isRegistering ? 'Criar Conta' : 'Entrar')}
              {!loading && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />}
            </Button>

            {loading && (
              <button
                type="button"
                onClick={() => setLoading(false)}
                className="w-full text-center text-xs text-textMuted hover:text-white mt-4 underline"
              >
                Demorando muito? Cancelar
              </button>
            )}
          </form>

          <div className="mt-6 text-center space-y-4">
            {isAdmin ? (
              <p className="text-xs text-textMuted">
                Esqueceu a senha? <a href="#" className="text-primary hover:underline">Contate o suporte</a>.
              </p>
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
