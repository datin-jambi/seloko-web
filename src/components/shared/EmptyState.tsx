import React from 'react'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ElementType
  actionLabel?: string
  onAction?: () => void
  /** Tanpa bingkai — untuk di dalam wadah lain (mis. tabel). */
  bare?: boolean
}

export function EmptyState({
  title = 'Belum Ada Data',
  description = 'Data yang Anda cari saat ini belum tersedia dalam sistem.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  bare,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center',
        !bare && 'rounded-lg border border-dashed border-border/80 bg-card/40',
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm" className="mt-5 text-xs">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
