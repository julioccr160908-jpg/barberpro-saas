import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    warningMessage?: string;
    confirmText: string;
    isDestructive?: boolean;
    loading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    warningMessage,
    confirmText,
    isDestructive = true,
    loading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-xl ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            <AlertTriangle size={32} strokeWidth={1.5} />
                        </div>
                        <button 
                            onClick={onClose}
                            disabled={loading}
                            className="text-zinc-500 hover:text-white transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2 font-display">{title}</h2>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                        {description}
                    </p>

                    {warningMessage && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                            <p className="text-xs text-red-400 font-medium">
                                {warningMessage}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button 
                            variant="secondary" 
                            className="flex-1" 
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            className={`flex-1 ${isDestructive ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {isDestructive && <Trash2 size={16} className="mr-2" />}
                            {loading ? 'Processando...' : confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
