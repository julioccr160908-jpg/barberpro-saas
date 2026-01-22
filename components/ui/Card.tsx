import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-surface border border-border rounded-xl shadow-xl overflow-hidden flex flex-col ${className}`}>
      <div className={`flex-1 flex flex-col min-h-0 ${noPadding ? '' : 'p-6'}`}>
        {children}
      </div>
    </div>
  );
};

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h3 className="text-lg font-display font-medium text-white tracking-wide uppercase">{title}</h3>
      {subtitle && <p className="text-sm text-textMuted mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);