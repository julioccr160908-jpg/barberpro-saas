import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import { CustomerLayout } from './CustomerLayout';
import { PublicBookingLayout } from './PublicBookingLayout';

interface ConditionalCustomerLayoutProps {
    children: React.ReactNode;
}

/**
 * Wrapper that shows:
 * - CustomerLayout (with sidebar) if user is logged in as CUSTOMER AND not visiting a specific slug
 * - PublicBookingLayout (minimal, no sidebar) otherwise (guests, admins, or visiting a specific shop slug)
 */
export const ConditionalCustomerLayout: React.FC<ConditionalCustomerLayoutProps> = ({ children }) => {
    const { user, role } = useAuth();
    const { slug } = useParams<{ slug?: string }>();

    // Only show customer layout if user is authenticated AND is a customer AND not visiting a public shop url
    const isAuthenticatedCustomer = user && role === Role.CUSTOMER;

    if (isAuthenticatedCustomer && !slug) {
        return <CustomerLayout>{children}</CustomerLayout>;
    }

    // For guests, admins, or any visits to /:slug, show public layout
    return <PublicBookingLayout>{children}</PublicBookingLayout>;
};
