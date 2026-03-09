import React, { useEffect, useState } from 'react';
import { Megaphone, X, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { PlatformService } from '../services/PlatformService';
import { useAuth } from '../contexts/AuthContext';

interface Broadcast {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'error' | 'success';
    dismissible: boolean;
}

export const SystemBroadcastBanner: React.FC = () => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [dismissed, setDismissed] = useState<string[]>([]);
    const { role } = useAuth();

    useEffect(() => {
        const fetchBroadcasts = async () => {
            // Pass the current role to filter targeted broadcasts
            const data = await PlatformService.getActiveBroadcasts(role || undefined);
            if (data) {
                setBroadcasts(data as Broadcast[]);
            }
        };

        if (role) {
            fetchBroadcasts();
        }
        
        // Refresh every 5 minutes
        const interval = setInterval(fetchBroadcasts, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [role]);

    const handleDismiss = (id: string) => {
        setDismissed(prev => [...prev, id]);
        const saved = JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
        localStorage.setItem('dismissed_broadcasts', JSON.stringify([...saved, id]));
    };

    // Load dismissed from localStorage on mount
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
        setDismissed(saved);
    }, []);

    const activeBroadcasts = broadcasts.filter(b => !dismissed.includes(b.id));

    if (activeBroadcasts.length === 0) return null;

    return (
        <div className="space-y-3 mb-6 animate-fade-in">
            {activeBroadcasts.map(broadcast => (
                <div 
                    key={broadcast.id}
                    className={`relative overflow-hidden rounded-xl border p-4 shadow-lg transition-all ${
                        broadcast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' :
                        broadcast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                        broadcast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 
                        'bg-blue-500/10 border-blue-500/20 text-blue-200'
                    }`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                            broadcast.type === 'warning' ? 'bg-amber-500/20' :
                            broadcast.type === 'error' ? 'bg-red-500/20' :
                            broadcast.type === 'success' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                        }`}>
                            {broadcast.type === 'warning' && <AlertTriangle size={20} />}
                            {broadcast.type === 'error' && <AlertOctagon size={20} />}
                            {broadcast.type === 'success' && <CheckCircle size={20} />}
                            {broadcast.type === 'info' && <Info size={20} />}
                        </div>
                        
                        <div className="flex-1 pr-6">
                            <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">{broadcast.title}</h4>
                            <p className="text-sm opacity-90 leading-relaxed">{broadcast.content}</p>
                        </div>

                        {broadcast.dismissible !== false && (
                            <button 
                                onClick={() => handleDismiss(broadcast.id)}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    <div className={`absolute bottom-0 left-0 h-1 w-full opacity-30 ${
                        broadcast.type === 'warning' ? 'bg-amber-500' :
                        broadcast.type === 'error' ? 'bg-red-500' :
                        broadcast.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`} />
                </div>
            ))}
        </div>
    );
};
