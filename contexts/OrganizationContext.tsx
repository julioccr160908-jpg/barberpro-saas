import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { Organization, Role } from '../types';

interface OrganizationContextType {
    organization: Organization | null;
    loading: boolean;
    refreshOrganization: () => Promise<void>;
    switchOrganization: (orgId: string) => Promise<void>;
    switchBySlug: (slug: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
    organization: null,
    loading: true,
    refreshOrganization: async () => { },
    switchOrganization: async () => { },
    switchBySlug: async () => { },
});

export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, role } = useAuth();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    const getActiveStaffCount = async (orgId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('organization_id', orgId)
                .in('role', ['BARBER', 'ADMIN']);

            if (error) {
                console.warn("Error fetching staff count:", error);
                return 0;
            }
            return data ? data.length : 0;
        } catch (error) {
            console.error("Failed to query profiles:", error);
            return 0;
        }
    };

    const mapOrg = async (raw: any): Promise<Organization> => {
        return {
            id: raw.id,
            name: raw.name,
            slug: raw.slug,
            ownerId: raw.owner_id,
            subscriptionStatus: raw.subscription_status,
            planType: raw.plan_type,
            logoUrl: raw.logo_url,
            bannerUrl: raw.banner_url,
            whatsappInstanceName: raw.whatsapp_instance_name,
            whatsappConnected: raw.whatsapp_connected ?? false,
            mpSubscriptionId: raw.mp_subscription_id ?? undefined,
            mpPayerEmail: raw.mp_payer_email ?? undefined,
            staffLimit: raw.staff_limit ?? 3,
            activeStaffCount: await getActiveStaffCount(raw.id),
            primaryColor: raw.primary_color,
            secondaryColor: raw.secondary_color,
            parentOrgId: raw.parent_org_id
        };
    };

    const switchOrganization = async (orgId: string) => {
        setLoading(true);
        try {
            const { data: org, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', orgId)
                .single();

            if (org) {
                const mapped = await mapOrg(org);
                setOrganization(mapped);
                // Persist the switch in local storage for the session
                localStorage.setItem('barberhost_selected_org_id', orgId);
                localStorage.setItem('barberhost_last_slug', org.slug);
            }
        } catch (error) {
            console.error("Error switching organization:", error);
        } finally {
            setLoading(false);
        }
    };

    const switchBySlug = async (slug: string) => {
        if (!slug || organization?.slug === slug) return;

        setLoading(true);
        try {
            const { data: org, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('slug', slug)
                .single();

            if (org) {
                const mapped = await mapOrg(org);
                setOrganization(mapped);
                localStorage.setItem('barberhost_selected_org_id', org.id);
                localStorage.setItem('barberhost_last_slug', org.slug);
            }
        } catch (error) {
            console.error("Error switching organization by slug:", error);
        } finally {
            setLoading(false);
        }
    };

    const refreshOrganization = useCallback(async () => {
        if (!user) {
            console.log("OrgContext: No user, clearing org.");
            setOrganization(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // 0. Manual Override / Persisted Selection
            const persistedOrgId = localStorage.getItem('barberhost_selected_org_id');
            const suOverrideId = localStorage.getItem('su_org_override');

            const targetId = (role === Role.SUPER_ADMIN && suOverrideId) ? suOverrideId : persistedOrgId;

            if (targetId) {
                const { data: targetOrg } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', targetId)
                    .single();

                if (targetOrg) {
                    setOrganization(await mapOrg(targetOrg));
                    setLoading(false);
                    return;
                }
            }

            // 1. Check user's profile for an explicit organization_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (profile?.organization_id) {
                const { data: profileOrg } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', profile.organization_id)
                    .single();

                if (profileOrg) {
                    setOrganization(await mapOrg(profileOrg));
                    return;
                }
            }

            // 2. Fallback: find an organization owned by the user (use first active one)
            let { data: ownedOrg } = await supabase
                .from('organizations')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (ownedOrg) {
                setOrganization(await mapOrg(ownedOrg));
                return;
            }

            // 3. Fallback: Check for persisted Slug (Customer Context)
            const lastSlug = localStorage.getItem('barberhost_last_slug');
            if (lastSlug) {
                const { data: slugOrg } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('slug', lastSlug)
                    .single();

                if (slugOrg) {
                    setOrganization(await mapOrg(slugOrg));
                    return;
                }
            }

            setOrganization(null);
        } catch (error) {
            console.error('Error fetching organization:', error);
        } finally {
            setLoading(false);
        }
    }, [user, role]);

    useEffect(() => {
        refreshOrganization();
    }, [refreshOrganization]);

    return (
        <OrganizationContext.Provider value={{ organization, loading, refreshOrganization, switchOrganization, switchBySlug }}>
            {children}
        </OrganizationContext.Provider>
    );
};
