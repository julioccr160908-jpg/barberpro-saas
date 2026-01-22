import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from './Button';

interface WhatsAppButtonProps {
    phone: string;
    message?: string;
    label?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; // Managed by Button component
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    compact?: boolean; // If true, shows only icon
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
    phone,
    message = '',
    label = 'WhatsApp',
    variant = 'outline',
    size = 'sm',
    className = '',
    compact = false
}) => {
    const handleClick = () => {
        // Remove non-digit chars
        let cleanPhone = phone.replace(/\D/g, '');

        // Basic validation/formatting for Brazil
        if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
            // Add country code if missing (assuming BR for this context)
            cleanPhone = '55' + cleanPhone;
        }

        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        window.open(url, '_blank');
    };

    if (!phone) return null;

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            className={`flex items-center gap-2 ${className} ${variant === 'outline' ? 'border-green-500/50 text-green-500 hover:bg-green-500/10' : ''}`}
        >
            <MessageCircle size={18} />
            {!compact && <span>{label}</span>}
        </Button>
    );
};
