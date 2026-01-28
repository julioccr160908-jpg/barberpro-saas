import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Role } from '../types';

interface AuthContextType {
    user: any | null;
    role: Role | null;
    loading: boolean;
    isAdmin: boolean;
    isBarber: boolean;
    signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    isAdmin: false,
    isBarber: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial check
        const checkUser = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                console.log('AuthContext DEBUG: User:', user, 'AuthError:', authError);

                if (authError) {
                    console.error("AuthContext Error getting user:", authError);
                }

                setUser(user);

                if (user) {
                    console.log('AuthContext DEBUG: Fetching profile for', user.id);
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    console.log('AuthContext DEBUG: Profile result:', profile, 'Error:', error);

                    if (error) {
                        console.error('AuthContext DEBUG: Profile fetch error:', error);
                    }

                    if (profile) {
                        console.log('AuthContext DEBUG: Setting role to:', profile.role);
                        setRole(profile.role as Role);
                    } else {
                        console.warn('AuthContext DEBUG: No profile found for user!');
                    }
                }
            } catch (error) {
                console.error('Error in AuthProvider:', error);
            } finally {
                setLoading(false);
            }
        };

        checkUser();

        // Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                if (profile) setRole(profile.role as Role);
            } else {
                setRole(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        role,
        loading,
        isBarber: role === Role.BARBER,
        signOut: () => supabase.auth.signOut(),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
