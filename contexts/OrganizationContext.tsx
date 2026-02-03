import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { Organization } from '../types';

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
    const { user } = useAuth();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

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
            if (overrideId) {
                // ... (existing logic)
                console.log("OrgContext: Using Override", overrideId);
                // ...
            }

            // ... (keep existing logic structure but add logs)

            // 1. Try to find an organization owned by the user (Admin view)
            let { data: ownedOrg, error: ownedError } = await supabase
                .from('organizations')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle();

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
                    bannerUrl: ownedOrg.banner_url
                });
                return;
            }

            // 2. If not owner, check if user is part of an organization (via profile)
            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (profile?.organization_id) {
                // ...
                console.log("OrgContext: User belongs to org via profile", profile.organization_id);
                // ...
            }

            // 3. Fallback: Check for persisted Slug (Customer Context)
            const lastSlug = localStorage.getItem('barberpro_last_slug');
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
                        bannerUrl: slugOrg.banner_url
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
