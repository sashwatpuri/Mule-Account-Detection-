import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 text-white shadow-sm hover:bg-blue-500 active:bg-blue-700',
        destructive:
          'bg-red-600 text-white shadow-sm hover:bg-red-500 active:bg-red-700',
        outline:
          'border border-white/10 bg-surface hover:bg-surface-hover hover:border-white/20 text-slate-200',
        secondary:
          'bg-surface-subtle text-slate-200 hover:bg-surface-hover border border-white/5',
        ghost:
          'text-slate-300 hover:bg-white/5 hover:text-white',
        link:
          'text-blue-400 underline-offset-4 hover:underline',
        subtle:
          'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
