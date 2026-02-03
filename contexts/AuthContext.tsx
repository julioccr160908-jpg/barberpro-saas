import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Role, User } from '../types';
import { useProfile } from '../hooks/useProfile';

interface AuthContextType {
    user: any | null;
    profile: User | null;
    role: Role | null;
    loading: boolean;
    isAdmin: boolean;
    isBarber: boolean;
    signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    role: null,
    loading: true,
    isAdmin: false,
    isBarber: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        // Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        // Auth Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Use Query Hook for Profile
    const { data: profile, isLoading: isProfileLoading } = useProfile(user?.id);

    const loading = authLoading || (!!user && isProfileLoading);

    // Derived State
    const role = profile?.role ?? null;
    const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
    const isBarber = role === Role.BARBER;

    const value = {
        user,
        role,
        profile,
        loading,
        isAdmin: role === Role.ADMIN || role === Role.SUPER_ADMIN,
        isBarber: role === Role.BARBER,
        signOut: () => supabase.auth.signOut(),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
