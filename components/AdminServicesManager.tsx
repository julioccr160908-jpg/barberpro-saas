
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Plus, Edit2, Trash2, X, Scissors, Clock, DollarSign, Upload, Loader2 } from 'lucide-react';
import { Service } from '../types';
import { db } from '../services/database';

export const AdminServicesManager: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load services from DB
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const data = await db.services.list();
      setServices(data);
    } catch (error) {
      console.error("Failed to fetch services", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    price: 0,
    durationMinutes: 30,
    description: '',
    imageUrl: '',
  });

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        price: 0,
        durationMinutes: 30,
        description: '',
        imageUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.name || !formData.price) return;

    try {
      if (editingService) {
        // Update logic
        const updatedService = { ...editingService, ...formData } as Service;
        await db.services.update(updatedService);
      } else {
        // Create logic
        const newService: Service = {
          id: '', // Supabase converts
          name: formData.name || '',
          price: Number(formData.price),
          durationMinutes: Number(formData.durationMinutes),
          description: formData.description || '',
          imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1503951914875-452162b7f304?q=80&w=800&auto=format&fit=crop', // Default image
        };
        await db.services.create(newService);
      }
      // Refresh list
      await fetchServices();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving service", error);
      alert("Erro ao salvar serviço.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        await db.services.delete(id);
        await fetchServices();
      } catch (error) {
        console.error("Error deleting service", error);
        alert("Erro ao excluir serviço.");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const presetImages = [
    'https://images.unsplash.com/photo-1599351431202-6e0000a40aa0?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503951914875-452162b7f304?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512690459411-b9245aed8ad5?q=80&w=800&auto=format&fit=crop',
  ];

  if (isLoading && services.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase">Menu de Serviços</h1>
          <p className="text-textMuted">Gerencie os cortes, preços e descrições oferecidos.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> Novo Serviço
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="group hover:border-primary/50 transition-all duration-300 flex flex-col h-full" noPadding>
            {/* Image Area */}
            <div className="relative h-48 overflow-hidden bg-surfaceHighlight">
              <img
                src={service.imageUrl || presetImages[0]}
                alt={service.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>

              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(service)}
                  className="p-2 bg-background/80 hover:bg-primary text-white hover:text-black rounded-full backdrop-blur-sm transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 bg-background/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white">{service.name}</h3>
                <span className="text-primary font-display font-bold text-lg">
                  R$ {service.price.toFixed(2)}
                </span>
              </div>

              <p className="text-textMuted text-sm mb-4 line-clamp-2 flex-1">
                {service.description}
              </p>

              <div className="pt-4 border-t border-border flex items-center text-sm text-textMuted">
                <Clock size={16} className="mr-2 text-primary" />
                <span>{service.durationMinutes} minutos</span>
              </div>
            </div>
          </Card>
        ))}
        {services.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-10 text-white/50 border border-dashed border-white/10 rounded-xl">
            Nenhum serviço cadastrado. Clique em "Novo Serviço" para começar.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-border bg-surfaceHighlight/50">
              <h2 className="text-xl font-display font-bold text-white">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-textMuted hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image Selection Column */}
                <div className="w-full md:w-1/3 space-y-4">
                  <label className="text-sm font-medium text-textMuted block">Imagem de Capa</label>

                  {/* Image Uploader */}
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden relative bg-surfaceHighlight group transition-colors">
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Upload className="text-white" size={24} />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="mx-auto text-textMuted mb-2" size={32} />
                        <span className="text-xs text-textMuted block">Clique para enviar</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>

                  <Input
                    placeholder="Ou cole uma URL"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="text-xs"
                  />
                </div>

                {/* Fields Column */}
                <div className="flex-1 space-y-4">
                  <Input
                    label="Nome do Serviço"
                    placeholder="Ex: Corte Degrade"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    icon={<Scissors size={18} />}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Preço (R$)"
                      type="number"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      icon={<DollarSign size={18} />}
                      required
                    />
                    <Input
                      label="Duração (min)"
                      type="number"
                      placeholder="30"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                      icon={<Clock size={18} />}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-textMuted block">Descrição</label>
                    <textarea
                      className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-white placeholder:text-textMuted/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none"
                      placeholder="Descreva os detalhes do serviço..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

