import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "bg-surfaceHighlight text-white border-transparent",
    outline: "text-white border border-border",
    success: "bg-green-500/15 text-green-500 border border-green-500/20",
    warning: "bg-yellow-500/15 text-yellow-500 border border-yellow-500/20",
    destructive: "bg-red-500/15 text-red-500 border border-red-500/20",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};