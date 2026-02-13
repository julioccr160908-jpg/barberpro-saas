import React, { createContext, useContext } from 'react';
import { ShopSettings } from '../types';
import { db } from '../services/database';
import { useAuth } from './AuthContext';
import { useSettingsQuery } from '../hooks/useSettingsQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface SettingsContextType {
    settings: ShopSettings;
    updateSettings: (newSettings: ShopSettings) => Promise<void>;
    isLoading: boolean;
}

const DEFAULT_SETTINGS: ShopSettings = {
    id: 0, // Placeholder
    interval_minutes: 30, // snake_case
    schedule: [] as any, // Json type
    organization_id: null,
    establishment_name: null,
    address: null,
    phone: null,
    city: null,
    state: null,
    zip_code: null,
    primary_color: null,
    secondary_color: null,
    loyalty_enabled: false,
    loyalty_target: null
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

import { useOrganization } from './OrganizationContext';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // const { profile } = useAuth(); // Old way
    const { organization } = useOrganization();

    // Query settings for the ACTIVE organization (whether Owner or Customer View)
    const { data: serverSettings, isLoading: queryLoading } = useSettingsQuery(organization?.id);
    const queryClient = useQueryClient();

    // We can keep local state for optimistic UI, or just rely on Query cache. 
    // Ideally, we use the server state, but if we want optimistic updates, useMutation is key.
    // For simplicity, let's proxy the query data, potentially falling back to defaults if not ready?

    const settings = React.useMemo(() => {
        const base = serverSettings || DEFAULT_SETTINGS;
        return {
            ...DEFAULT_SETTINGS,
            ...base,
            // Ensure critical fields are never null/undefined
            interval_minutes: base.interval_minutes || 30,
            schedule: base.schedule || DEFAULT_SETTINGS.schedule
        };
    }, [serverSettings]);

    const { mutateAsync: updateSettingsMutation } = useMutation({
        mutationFn: async (newSettings: ShopSettings) => {
            await db.settings.update(newSettings);
        },
        onMutate: async (newSettings) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['settings', organization?.id] });

            // Snapshot
            const previousSettings = queryClient.getQueryData(['settings', organization?.id]);

            // Optimistic update
            queryClient.setQueryData(['settings', organization?.id], newSettings);

            return { previousSettings };
        },
        onError: (err, newSettings, context: any) => {
            queryClient.setQueryData(['settings', organization?.id], context.previousSettings);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', organization?.id] });
        }
    });

    const updateSettings = async (newSettings: ShopSettings) => {
        await updateSettingsMutation(newSettings);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isLoading: queryLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

