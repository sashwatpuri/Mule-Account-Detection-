import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors border',
  {
    variants: {
      variant: {
        default:
          'border-blue-500/30 bg-blue-500/10 text-blue-300',
        secondary:
          'border-white/10 bg-slate-800/60 text-slate-300',
        outline:
          'border-white/15 bg-transparent text-slate-300',
        high:
          'border-red-500/30 bg-red-500/15 text-red-300 font-semibold',
        medium:
          'border-amber-500/30 bg-amber-500/15 text-amber-300 font-medium',
        low:
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 font-medium',
        neutral:
          'border-slate-700 bg-slate-800/40 text-slate-400',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-1.5 py-0.2 text-[10px] leading-tight',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'high' && 'bg-red-400 animate-pulse',
            variant === 'medium' && 'bg-amber-400',
            variant === 'low' && 'bg-emerald-400',
            variant === 'default' && 'bg-blue-400',
            (!variant || variant === 'secondary' || variant === 'outline' || variant === 'neutral') &&
              'bg-slate-400'
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
