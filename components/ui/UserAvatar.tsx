import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  vip?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  src, 
  name, 
  size = 'md', 
  className = '',
  vip = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
        setIsLoading(false);
        setError(true);
        return;
    }
    
    setIsLoading(true);
    setError(false);
    
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoading(false);
    img.onerror = () => {
        setIsLoading(false);
        setError(true);
    };
  }, [src]);

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : '??';

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  if (isLoading) {
    return <Skeleton className={`${sizeClasses[size]} rounded-full ${className}`} />;
  }

  if (error || !src) {
    // Generate a consistent background color based on name
    const colors = [
        'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 
        'bg-amber-500', 'bg-rose-500', 'bg-indigo-500',
        'bg-cyan-500', 'bg-teal-500'
    ];
    const charCodeSum = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const bgColor = colors[charCodeSum % colors.length];

    return (
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-inner border border-white/10 ${bgColor} ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border border-white/10 shadow-sm relative ${className}`}>
      <img 
        src={src} 
        alt={name || 'User'} 
        className="w-full h-full object-cover"
      />
    </div>
  );
};
