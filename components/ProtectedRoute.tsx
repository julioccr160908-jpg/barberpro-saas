
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, role, loading } = useAuth();
    const [isImpersonating, setIsImpersonating] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (localStorage.getItem('su_org_override')) {
            setIsImpersonating(true);
        }
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role check logic
    if (allowedRoles && allowedRoles.length > 0) {
        const effectiveRole = isImpersonating ? Role.ADMIN : role;

        // If effective role is missing or not in allowed list
        if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
            // Redirect logic based on what they actually are
            if (role === Role.SUPER_ADMIN) return <Navigate to="/platform/dashboard" replace />;
            if (role === Role.ADMIN || role === Role.BARBER) return <Navigate to="/admin/dashboard" replace />;
            return <Navigate to="/book" replace />;
        }
    }

    return <>{children}</>;
};
