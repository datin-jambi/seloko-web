import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Satu field form: label di atas, petunjuk/error di bawah. PRD 02 §7 (Input).
// `error` menggantikan `hint`; id error dihubungkan lewat aria-describedby oleh pemanggil (`${id}-msg`).
export function FormField({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: ReactNode
  error?: string
  className?: string
  children: ReactNode
}) {
  const msg = error ?? hint
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-destructive">
            *
          </span>
        ) : (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            <span className="sr-only">, </span>opsional
          </span>
        )}
      </label>
      {children}
      {msg && (
        <p id={`${id}-msg`} className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
          {msg}
        </p>
      )}
    </div>
  )
}
