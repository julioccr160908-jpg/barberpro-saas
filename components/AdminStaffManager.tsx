import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Plus, Edit2, Trash2, X, User, Mail, Briefcase, Shield, Upload, Loader2, Lock } from 'lucide-react';
import { User as UserType, Role } from '../types';
import { db } from '../services/database';
import { supabase } from '../services/supabase';

export const AdminStaffManager: React.FC = () => {
  const [staff, setStaff] = useState<UserType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load staff from DB
  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const data = await db.staff.list();
      setStaff(data);
    } catch (error) {
      console.error("Failed to fetch staff", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const [formData, setFormData] = useState<Partial<UserType> & { password?: string }>({
    name: '',
    email: '',
    role: Role.BARBER,
    jobTitle: '',
    avatarUrl: '',
    password: ''
  });

  const handleOpenModal = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setFormData({ ...user, password: '' });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: Role.BARBER,
        jobTitle: '',
        avatarUrl: '',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) return;

    try {
      if (editingUser) {
        const updatedUser = {
          id: editingUser.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          jobTitle: formData.jobTitle,
          avatarUrl: formData.avatarUrl
        } as UserType;

        await db.staff.update(updatedUser);
      } else {
        if (!formData.password) {
          alert("Senha é obrigatória para novos membros.");
          return;
        }

        // 1. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name }
          }
        });

        if (authError) {
          console.error("Auth error:", authError);
          alert(`Erro na autenticação: ${authError.message}`);
          return;
        }

        if (authData.user) {
          // 2. Create Profile in DB linked to Auth ID
          const newUser = {
            id: authData.user.id, // CRITICAL: Use Auth ID
            name: formData.name,
            email: formData.email,
            role: formData.role || Role.BARBER,
            job_title: formData.jobTitle || 'Barbeiro',
            avatar_url: formData.avatarUrl || 'https://images.unsplash.com/photo-1534360406560-593259695629?q=80&w=200&auto=format&fit=crop',
          };

          const { error: profileError } = await supabase.from('profiles').insert([newUser]);

          if (profileError) {
            console.error("Profile error:", profileError);
            alert("Usuário criado, mas erro ao criar perfil. Contate suporte.");
          }
        }
      }
      await fetchStaff();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving staff member", error);
      alert("Erro ao salvar membro da equipe.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este membro da equipe?')) {
      setIsLoading(true);
      try {
        console.log('Deletando usuário:', id);
        await db.staff.delete(id);
        console.log('Usuário deletado com sucesso');
        await fetchStaff();
        alert('✅ Membro removido com sucesso!');
      } catch (error: any) {
        console.error("Error deleting staff member", error);
        alert(`❌ Erro ao excluir membro: ${error.message || 'Erro desconhecido'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase">Equipe</h1>
          <p className="text-textMuted">Gerencie os profissionais da barbearia.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> Adicionar Membro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && staff.length === 0 ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : staff.map((user) => (
          <Card key={user.id} className="relative group hover:border-primary/50 transition-colors">
            <div className="flex items-start gap-4">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-surfaceHighlight group-hover:border-primary transition-colors"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1534360406560-593259695629?q=80&w=200&auto=format&fit=crop';
                }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{user.name}</h3>
                <p className="text-primary text-sm mb-1">{user.jobTitle}</p>
                <div className="flex items-center text-xs text-textMuted truncate">
                  <Mail size={12} className="mr-1.5" />
                  {user.email}
                </div>
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surfaceHighlight border border-border text-textMuted uppercase">
                  {user.role === Role.ADMIN ? <Shield size={10} className="mr-1" /> : <User size={10} className="mr-1" />}
                  {user.role}
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenModal(user)} className="text-textMuted hover:text-white p-1">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(user.id)} className="text-textMuted hover:text-red-500 p-1">
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-border bg-surfaceHighlight/50">
              <h2 className="text-xl font-display font-bold text-white">
                {editingUser ? 'Editar Membro' : 'Novo Membro'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-textMuted hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">

              {/* Avatar Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-textMuted">Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="relative group/avatar">
                    <img
                      src={formData.avatarUrl || 'https://images.unsplash.com/photo-1534360406560-593259695629?q=80&w=200&auto=format&fit=crop'}
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary/50"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1534360406560-593259695629?q=80&w=200&auto=format&fit=crop';
                      }}
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                      <Upload size={20} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>

                  <div className="flex-1">
                    <Input
                      placeholder="Ou cole uma URL externa..."
                      value={formData.avatarUrl}
                      onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nome Completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  icon={<User size={18} />}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="E-mail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    icon={<Mail size={18} />}
                    required
                    disabled={!!editingUser}
                  />

                  {!editingUser && (
                    <Input
                      label="Senha Inicial"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      icon={<Lock size={18} />}
                      required
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Cargo"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    icon={<Briefcase size={18} />}
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-textMuted block">Permissão</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                      className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary"
                    >
                      <option value={Role.BARBER}>Barbeiro</option>
                      <option value={Role.ADMIN}>Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
