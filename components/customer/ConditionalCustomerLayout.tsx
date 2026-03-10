import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Role } from '../../types';
import { CustomerLayout } from './CustomerLayout';
import { PublicBookingLayout } from './PublicBookingLayout';

interface ConditionalCustomerLayoutProps {
    children: React.ReactNode;
}

/**
 * Wrapper that shows:
 * - CustomerLayout (with sidebar) if user is logged in as CUSTOMER
 * - PublicBookingLayout (minimal, no sidebar) for guests or admins
 */
export const ConditionalCustomerLayout: React.FC<ConditionalCustomerLayoutProps> = ({ children }) => {
    const { user, role } = useAuth();
    const { switchBySlug } = useOrganization();
    const { slug } = useParams<{ slug?: string }>();

    // Update organization context if visiting a specific merchant slug
    useEffect(() => {
        if (slug) {
            switchBySlug(slug);
        }
    }, [slug, switchBySlug]);

    // Only show customer layout if user is authenticated AND is a customer
    const isAuthenticatedCustomer = user && role === Role.CUSTOMER;

    if (isAuthenticatedCustomer) {
        return <CustomerLayout>{children}</CustomerLayout>;
    }

    // For guests or admins visiting public shop urls, show public layout
    return <PublicBookingLayout>{children}</PublicBookingLayout>;
};
