import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium leading-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-destructive/25 bg-destructive/10 text-destructive',
        outline: 'border-border text-muted-foreground',
        success:
          'border-green-700/20 bg-green-700/10 text-green-800 dark:border-green-400/25 dark:bg-green-400/10 dark:text-green-400',
        warning:
          'border-amber-700/20 bg-amber-600/10 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-400',
        info: 'border-primary/20 bg-primary/10 text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
