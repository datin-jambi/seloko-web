import { useSyncExternalStore } from 'react'
import { pendingRequests } from '@/lib/api-client'
import { cn } from '@/lib/utils'

// Bar tipis di atas layar selama ada request API berjalan.
export function TopLoader() {
  const busy = useSyncExternalStore(pendingRequests.subscribe, pendingRequests.isBusy)

  return (
    <div
      role="progressbar"
      aria-hidden={!busy}
      aria-label="Memuat"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-primary',
        busy
          ? 'animate-toploader'
          : 'opacity-0 transition-opacity delay-150 duration-300 motion-reduce:transition-none',
      )}
    />
  )
}
