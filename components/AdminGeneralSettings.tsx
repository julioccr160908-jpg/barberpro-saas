
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Store, Globe, Phone, MapPin, Building, Loader2, Save, Check } from 'lucide-react';
import { db } from '../services/database';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export const AdminGeneralSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form Stats
    const [establishmentName, setEstablishmentName] = useState('');
    const [slug, setSlug] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const [settingsData, orgData] = await Promise.all([
                db.settings.get(),
                db.organizations.get()
            ]);

            if (settingsData) {
                setEstablishmentName(settingsData.establishment_name || '');
                setAddress(settingsData.address || '');
                setPhone(settingsData.phone || '');
                setCity(settingsData.city || '');
                setState(settingsData.state || '');
                setZipCode(settingsData.zip_code || '');
            }

            if (orgData) {
                setSlug(orgData.slug || '');
            }
        } catch (error) {
            console.error("Failed to load settings", error);
            toast.error("Erro ao carregar configurações");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update Settings
            await db.settings.update({
                establishment_name: establishmentName,
                address,
                phone,
                city,
                state,
                zip_code: zipCode
            });

            // Update Organization Slug (if changed)
            if (slug) {
                // Check if slug changed
                const currentOrg = await db.organizations.get();
                if (currentOrg && currentOrg.slug !== slug) {
                    await supabase.from('organizations').update({ slug }).eq('id', currentOrg.id);
                }
            }

            setSuccess(true);
            toast.success("Dados salvos com sucesso!");
            setTimeout(() => setSuccess(false), 3000);
        } catch (error: any) {
            console.error(error);
            if (error.code === '23505') { // Unique violation
                toast.error("Este link (URL) já está em uso. Escolha outro.");
            } else {
                toast.error("Erro ao salvar dados.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-xl border border-white/5">
                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-textMuted">Nome do Estabelecimento</label>
                    <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                        <input
                            type="text"
                            value={establishmentName}
                            onChange={(e) => setEstablishmentName(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="Ex: Barbearia do Júlio"
                        />
                    </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-textMuted">URL da Barbearia (Link de Agendamento)</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                        <div className="flex items-center w-full bg-background border border-white/10 rounded-lg focus-within:border-primary transition-colors">
                            <span className="pl-10 pr-1 py-2 text-textMuted text-sm border-r border-white/10 bg-white/5 rounded-l-lg select-none">
                                barberhost.com/
                            </span>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                    setSlug(val);
                                }}
                                className="flex-1 bg-transparent border-none py-2 px-3 text-white focus:outline-none placeholder-white/20"
                                placeholder="sua-barbearia"
                            />
                        </div>
                        <p className="text-xs text-textMuted mt-1 ml-1">
                            Este é o endereço que seus clientes usarão para acessar sua página.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-textMuted">Telefone / WhatsApp</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-textMuted">CEP</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                        <input
                            type="text"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="00000-000"
                        />
                    </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-textMuted">Endereço Completo</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="Rua, Número, Bairro"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-textMuted">Cidade</label>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="Cidade"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-textMuted">Estado (UF)</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                        <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="SP"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    size="lg"
                    className="shadow-2xl shadow-primary/20 hover:scale-105 transition-transform"
                    disabled={saving}
                >
                    {saving ? <Loader2 size={24} className="animate-spin" /> : (
                        <>
                            {success ? <Check className="mr-2" /> : <Save className="mr-2" />}
                            {success ? 'Salvo!' : 'Salvar Alterações'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
