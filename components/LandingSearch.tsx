import React, { useState } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export const LandingSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            // Search by name or slug
            const { data, error } = await supabase
                .from('organizations')
                .select('id, name, slug, city, state')
                .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
                .limit(5);

            if (data) {
                setResults(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto relative z-10">
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value.length > 2) {
                            // Debounce could be here, but simple submit is fine for now
                        } else {
                            setResults([]);
                        }
                    }}
                    placeholder="Busque sua barbearia..."
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-4 pl-12 pr-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-xl"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-secondary p-2 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                </button>
            </form>

            {/* Results Dropdown */}
            {results.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {results.map(org => (
                        <div
                            key={org.id}
                            onClick={() => navigate(`/${org.slug}`)}
                            className="p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                        >
                            <h3 className="font-bold text-white">{org.name}</h3>
                            <p className="text-sm text-textMuted flex items-center gap-1">
                                {org.city && `${org.city} - ${org.state}`}
                                <span className="ml-auto text-primary text-xs bg-primary/10 px-2 py-0.5 rounded-full">@{org.slug}</span>
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {query.length > 2 && results.length === 0 && !loading && (
                // Only show if specifically searched and found nothing (optional)
                null
            )}
        </div>
    );
};
