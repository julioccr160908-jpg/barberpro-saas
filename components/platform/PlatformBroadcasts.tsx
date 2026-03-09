import React from 'react';
import { Megaphone, Plus, MessageSquare, Trash2, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PlatformService } from '../../services/PlatformService';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';

export const PlatformBroadcasts: React.FC = () => {
    const [broadcasts, setBroadcasts] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isCreating, setIsCreating] = React.useState(false);
    const [newBroadcast, setNewBroadcast] = React.useState({
        title: '',
        content: '',
        type: 'info' as 'info' | 'warning' | 'error' | 'success',
        target_role: 'admin'
    });

    const loadBroadcasts = async () => {
        setLoading(true);
        const { data } = await supabase.from('system_broadcasts').select('*').order('created_at', { ascending: false });
        if (data) setBroadcasts(data);
        setLoading(false);
    };

    React.useEffect(() => {
        loadBroadcasts();
    }, []);

    const handleCreate = async () => {
        if (!newBroadcast.title || !newBroadcast.content) return;
        const { error } = await supabase.from('system_broadcasts').insert([newBroadcast]);
        if (error) {
            toast.error('Erro ao criar aviso');
        } else {
            toast.success('Aviso criado com sucesso!');
            setIsCreating(false);
            setNewBroadcast({ title: '', content: '', type: 'info', target_role: 'admin' });
            loadBroadcasts();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir este aviso?')) return;
        const { error } = await supabase.from('system_broadcasts').delete().eq('id', id);
        if (error) toast.error('Erro ao excluir');
        else loadBroadcasts();
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Avisos do Sistema</h1>
                    <p className="text-zinc-400">Envie mensagens globais para donos de barbearias e profissionais.</p>
                </div>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                        <Plus size={16} />
                        Novo Aviso
                    </Button>
                )}
            </header>

            {isCreating && (
                <Card className="bg-zinc-900 border-zinc-700 p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white">Novo Comunicado Global</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Título</label>
                            <input 
                                type="text" 
                                value={newBroadcast.title}
                                onChange={e => setNewBroadcast({...newBroadcast, title: e.target.value})}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Tipo</label>
                            <select 
                                value={newBroadcast.type}
                                onChange={e => setNewBroadcast({...newBroadcast, type: e.target.value as any})}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="info">Informação (Azul)</option>
                                <option value="warning">Aviso (Amarelo)</option>
                                <option value="success">Sucesso (Verde)</option>
                                <option value="error">Crítico (Vermelho)</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Conteúdo da Mensagem</label>
                        <textarea 
                            rows={3}
                            value={newBroadcast.content}
                            onChange={e => setNewBroadcast({...newBroadcast, content: e.target.value})}
                            className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 h-24"
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsCreating(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} className="bg-blue-600 text-white hover:bg-blue-700">
                            <Send size={16} className="mr-2" />
                            Publicar Agora
                        </Button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
                {broadcasts.map(b => (
                    <Card key={b.id} className="bg-zinc-900 border-zinc-800 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                                b.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                b.type === 'error' ? 'bg-red-500/10 text-red-500' :
                                b.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                            }`}>
                                <Megaphone size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">{b.title}</h4>
                                <p className="text-sm text-zinc-500 line-clamp-1">{b.content}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-500 font-mono">
                                {new Date(b.created_at).toLocaleDateString()}
                            </span>
                            <button onClick={() => handleDelete(b.id)} className="p-2 text-zinc-600 hover:text-red-400">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </Card>
                ))}

                {!loading && broadcasts.length === 0 && !isCreating && (
                    <Card className="bg-zinc-900 border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
                            <Megaphone size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum aviso ativo</h3>
                        <p className="text-zinc-500 max-w-sm">
                            Você ainda não criou nenhum comunicado global. Crie um para avisar sobre manutenções ou novas funcionalidades.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
};
