import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  role?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, role, src, size = 'md', className, ...props }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-200 font-semibold select-none overflow-hidden shrink-0',
        sizeClasses[size],
        className
      )}
      title={`${name}${role ? ` • ${role}` : ''}`}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
