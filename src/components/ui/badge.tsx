import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Badge status: tinggi tetap 22px, latar lembut + teks tegas (kontras AA di kedua tema).
// Varian status boleh memakai titik penanda (`dot`) agar status terbaca tanpa bergantung warna saja.
const badgeVariants = cva(
  'inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-xs font-medium leading-none [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border bg-transparent text-foreground',
        neutral: 'border-input bg-muted text-secondary-foreground/80',
        info: 'border-primary/25 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/15 dark:text-blue-300',
        success:
          'border-emerald-600/25 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
        warning:
          'border-amber-600/25 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300',
        destructive:
          'border-destructive/25 bg-destructive/10 text-destructive dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Titik bulat di depan label, warna mengikuti teks. */
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
