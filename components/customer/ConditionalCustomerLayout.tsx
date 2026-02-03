import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import { CustomerLayout } from './CustomerLayout';
import { PublicBookingLayout } from './PublicBookingLayout';

interface ConditionalCustomerLayoutProps {
    children: React.ReactNode;
}

/**
 * Wrapper that shows:
 * - CustomerLayout (with sidebar) if user is logged in as CUSTOMER
 * - PublicBookingLayout (minimal, no sidebar) otherwise (guests, admins, etc.)
 */
export const ConditionalCustomerLayout: React.FC<ConditionalCustomerLayoutProps> = ({ children }) => {
    const { user, role } = useAuth();

    // Only show customer layout if user is authenticated AND is a customer
    const isAuthenticatedCustomer = user && role === Role.CUSTOMER;

    if (isAuthenticatedCustomer) {
        return <CustomerLayout>{children}</CustomerLayout>;
    }

    // For guests, admins, or any other role, show public layout
    return <PublicBookingLayout>{children}</PublicBookingLayout>;
};
