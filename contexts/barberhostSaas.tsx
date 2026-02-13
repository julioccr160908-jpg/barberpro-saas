import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShopSettings } from '../types';
import { db } from '../services/database';

interface SettingsContextType {
    settings: ShopSettings;
    updateSettings: (newSettings: ShopSettings) => void;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Use state to hold settings, initializing from db if possible, 
    // but better to load in effect to avoid hydration mismatches if using SSR (though this looks like pure CSR)
    const [settings, setSettings] = useState<ShopSettings>(db.settings.get());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load settings from DB on mount
        const loadSettings = () => {
            const data = db.settings.get();
            setSettings(data);
            setIsLoading(false);
        };
        loadSettings();
    }, []);

    const updateSettings = (newSettings: ShopSettings) => {
        db.settings.update(newSettings);
        setSettings(newSettings);
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
