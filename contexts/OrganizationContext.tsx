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
            setOrganization(null);
            setLoading(false);
            return;
        }

        try {
            // 1. Try to find an organization owned by the user (Admin view)
            let { data: ownedOrg, error: ownedError } = await supabase
                .from('organizations')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (ownedOrg) {
                setOrganization({
                    id: ownedOrg.id,
                    name: ownedOrg.name,
                    slug: ownedOrg.slug,
                    ownerId: ownedOrg.owner_id,
                    subscriptionStatus: ownedOrg.subscription_status,
                    planType: ownedOrg.plan_type
                });
                return;
            }

            // 2. If not owner, check if user is part of an organization (via profile)
            // This is for Staff/Customers who don't own the org but belong to one.
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
                    setOrganization({
                        id: profileOrg.id,
                        name: profileOrg.name,
                        slug: profileOrg.slug,
                        ownerId: profileOrg.owner_id,
                        subscriptionStatus: profileOrg.subscription_status,
                        planType: profileOrg.plan_type
                    });
                    return;
                }
            }

            console.log('No organization found for user');
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
