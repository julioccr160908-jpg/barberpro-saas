import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { Organization, Role } from '../types';

interface OrganizationContextType {
    organization: Organization | null;
    loading: boolean;
    refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
    organization: null,
    loading: true,
    refreshOrganization: async () => { },
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

    const refreshOrganization = async () => {
        if (!user) {
            console.log("OrgContext: No user, clearing org.");
            setOrganization(null);
            setLoading(false);
            return;
        }

        try {
            console.log("OrgContext: Refreshing for user", user.id);
            // 0. Super Admin Override Check
            const overrideId = localStorage.getItem('su_org_override');
            if (overrideId && role === Role.SUPER_ADMIN) {
                console.log("OrgContext: Using Override", overrideId);
                const { data: overrideOrg, error: overrideError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', overrideId)
                    .single();

                if (overrideOrg) {
                    setOrganization({
                        id: overrideOrg.id,
                        name: overrideOrg.name,
                        slug: overrideOrg.slug,
                        ownerId: overrideOrg.owner_id,
                        subscriptionStatus: overrideOrg.subscription_status,
                        planType: overrideOrg.plan_type,
                        logoUrl: overrideOrg.logo_url,
                        bannerUrl: overrideOrg.banner_url,
                        whatsappInstanceName: overrideOrg.whatsapp_instance_name,
                        whatsappConnected: overrideOrg.whatsapp_connected ?? false,
                        mpSubscriptionId: overrideOrg.mp_subscription_id ?? undefined,
                        mpPayerEmail: overrideOrg.mp_payer_email ?? undefined,
                        staffLimit: overrideOrg.staff_limit ?? 3,
                        activeStaffCount: await getActiveStaffCount(overrideOrg.id)
                    });
                    setLoading(false);
                    return;
                } else {
                    console.warn("OrgContext: Override org not found, clearing override", overrideError);
                    localStorage.removeItem('su_org_override');
                }
            } else if (overrideId) {
                // If there's an override but we're not a Super Admin, clear it
                console.warn("OrgContext: Accidental override detected for non-super-admin. Clearing.");
                localStorage.removeItem('su_org_override');
            }

            // 1. First check user's profile for an explicit organization_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (profile?.organization_id) {
                console.log("OrgContext: Using profile org_id", profile.organization_id);
                const { data: profileOrg } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', profile.organization_id)
                    .single();

                if (profileOrg) {
                    setOrganization({
                        id: profileOrg.id,
                        name: profileOrg.name,
                        slug: profileOrg.slug,
                        ownerId: profileOrg.owner_id,
                        subscriptionStatus: profileOrg.subscription_status,
                        planType: profileOrg.plan_type,
                        logoUrl: profileOrg.logo_url,
                        bannerUrl: profileOrg.banner_url,
                        whatsappInstanceName: profileOrg.whatsapp_instance_name,
                        whatsappConnected: profileOrg.whatsapp_connected ?? false,
                        mpSubscriptionId: profileOrg.mp_subscription_id ?? undefined,
                        mpPayerEmail: profileOrg.mp_payer_email ?? undefined,
                        staffLimit: profileOrg.staff_limit ?? 3,
                        activeStaffCount: await getActiveStaffCount(profileOrg.id)
                    });
                    return;
                }
            }

            // 2. Fallback: find an organization owned by the user (use first active one)
            let { data: ownedOrg, error: ownedError } = await supabase
                .from('organizations')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: true })
                .limit(1)
                .single();

            if (ownedOrg) {
                console.log("OrgContext: User owns org", ownedOrg.slug);
                setOrganization({
                    id: ownedOrg.id,
                    name: ownedOrg.name,
                    slug: ownedOrg.slug,
                    ownerId: ownedOrg.owner_id,
                    subscriptionStatus: ownedOrg.subscription_status,
                    planType: ownedOrg.plan_type,
                    logoUrl: ownedOrg.logo_url,
                    bannerUrl: ownedOrg.banner_url,
                    whatsappInstanceName: ownedOrg.whatsapp_instance_name,
                    whatsappConnected: ownedOrg.whatsapp_connected ?? false,
                    mpSubscriptionId: ownedOrg.mp_subscription_id ?? undefined,
                    mpPayerEmail: ownedOrg.mp_payer_email ?? undefined,
                    staffLimit: ownedOrg.staff_limit ?? 3,
                    activeStaffCount: await getActiveStaffCount(ownedOrg.id)
                });
                return;
            }

            // If we get here, no org was found for this user

            // 3. Fallback: Check for persisted Slug (Customer Context)
            const lastSlug = localStorage.getItem('barberhost_last_slug');
            console.log("OrgContext: Checking fallback slug:", lastSlug);

            if (lastSlug) {
                const { data: slugOrg, error: slugError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('slug', lastSlug)
                    .single();

                if (slugOrg) {
                    console.log("OrgContext: Resolved org from slug", slugOrg.slug);
                    setOrganization({
                        id: slugOrg.id,
                        name: slugOrg.name,
                        slug: slugOrg.slug,
                        ownerId: slugOrg.owner_id,
                        subscriptionStatus: slugOrg.subscription_status,
                        planType: slugOrg.plan_type,
                        logoUrl: slugOrg.logo_url,
                        bannerUrl: slugOrg.banner_url,
                        whatsappInstanceName: slugOrg.whatsapp_instance_name,
                        whatsappConnected: slugOrg.whatsapp_connected ?? false,
                        mpSubscriptionId: slugOrg.mp_subscription_id ?? undefined,
                        mpPayerEmail: slugOrg.mp_payer_email ?? undefined,
                        staffLimit: slugOrg.staff_limit ?? 3,
                        activeStaffCount: await getActiveStaffCount(slugOrg.id)
                    });
                    setLoading(false);
                    return;
                } else {
                    console.warn("OrgContext: Failed to find org for slug", lastSlug, slugError);
                }
            }

            console.log('OrgContext: No organization found for user');
            setOrganization(null);

        } catch (error) {
            console.error('Error fetching organization:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshOrganization();
    }, [user]);

    return (
        <OrganizationContext.Provider value={{ organization, loading, refreshOrganization }}>
            {children}
        </OrganizationContext.Provider>
    );
};
