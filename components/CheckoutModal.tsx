import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, X, CheckCircle, Package } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Product, Appointment } from '../types';
import { toast } from 'sonner';

interface CheckoutModalProps {
  appointment: Appointment & { serviceName: string; servicePrice: number };
  onClose: () => void;
  onConfirm: (products: { id: string, quantity: number, price: number }[]) => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ appointment, onClose, onConfirm }) => {
  const [selectedItems, setSelectedItems] = useState<{ product: Product, quantity: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', appointment.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', appointment.organization_id)
        .eq('is_active', true)
        .gt('stock_quantity', 0);
      if (error) throw error;
      return data as Product[];
    }
  });

  const addItem = (product: Product) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error('Estoque insuficiente');
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setSelectedItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > item.product.stock_quantity) {
          toast.error('Estoque insuficiente');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalProducts = selectedItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const grandTotal = appointment.servicePrice + totalProducts;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const items = selectedItems.map(item => ({
        id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));
      await onConfirm(items);
      toast.success('Venda e agendamento concluídos!');
      onClose();
    } catch (error: any) {
      toast.error('Erro ao finalizar check-out: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Finalizar Atendimento</h2>
            <p className="text-sm text-zinc-500">{appointment.customer?.name} • {appointment.serviceName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Products List */}
          <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-zinc-800 custom-scrollbar">
            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2">
              <Package size={14} /> Adicionar Produtos
            </h3>
            
            {isLoading ? (
              <div className="text-center py-8 text-zinc-500">Carregando produtos...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">Nenhum produto em estoque.</div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-transparent hover:border-yellow-500/50 hover:bg-zinc-800 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-600 group-hover:text-yellow-500 transition-colors">
                            <Package size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{product.name}</p>
                            <p className="text-xs text-zinc-500">Estoque: {product.stock_quantity} un</p>
                        </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-white">R$ {product.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div className="w-full md:w-80 p-6 bg-black/20 overflow-y-auto custom-scrollbar flex flex-col">
            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2">
              <ShoppingCart size={14} /> Resumo do Pedido
            </h3>

            <div className="flex-1 space-y-4">
              {/* Service */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-white">{appointment.serviceName}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Serviço</p>
                </div>
                <span className="text-sm font-mono font-bold text-white">R$ {appointment.servicePrice.toFixed(2)}</span>
              </div>

              {/* Selected Products */}
              {selectedItems.map(item => (
                <div key={item.product.id} className="flex justify-between items-center group">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white line-clamp-1">{item.product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"><Minus size={12} /></button>
                      <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"><Plus size={12} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-mono font-bold text-white">R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeItem(item.product.id)} className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-semibold">Remover</button>
                  </div>
                </div>
              ))}

              {selectedItems.length === 0 && (
                <p className="text-center py-4 text-xs text-zinc-600 italic">Nenhum produto adicionado</p>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800 space-y-3">
              <div className="flex justify-between text-zinc-400 text-sm">
                <span>Produtos</span>
                <span>R$ {totalProducts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-lg">
                <span>TOTAL</span>
                <span className="text-yellow-500">R$ {grandTotal.toFixed(2)}</span>
              </div>
              <Button 
                fullWidth 
                onClick={handleConfirm} 
                className="mt-4" 
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} className="mr-2" /> Finalizar</>}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const Loader2 = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
