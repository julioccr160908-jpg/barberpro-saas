
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShopSettings } from '../types';
import { db } from '../services/database';

interface SettingsContextType {
    settings: ShopSettings;
    updateSettings: (newSettings: ShopSettings) => Promise<void>;
    isLoading: boolean;
}

const DEFAULT_SETTINGS: ShopSettings = {
    intervalMinutes: 30,
    schedule: [] // Will cause all days to be closed until loaded
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                const data = await db.settings.get();
                if (data) {
                    setSettings(data);
                }
            } catch (error) {
                console.error("Failed to load settings context", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    const updateSettings = async (newSettings: ShopSettings) => {
        // Optimistic update
        setSettings(newSettings);
        try {
            await db.settings.update(newSettings);
        } catch (error) {
            console.error("Failed to update settings context", error);
            // Rollback could be implemented here if needed, reloading from server
            const data = await db.settings.get();
            if (data) setSettings(data);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
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

