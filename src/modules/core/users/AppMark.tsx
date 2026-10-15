import { Building2, LayoutGrid, Shield, Smartphone, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

// Penanda aplikasi: ikon + warna per kode app. Kode tak dikenal → ikon grid netral.
// Warna memakai token tema (primary) atau palet Tailwind yang sama dengan badge, tanpa gradien.
const MARKS: Record<string, { Icon: typeof Shield; className: string }> = {
  seloko: { Icon: Shield, className: 'bg-blue-500/15 text-blue-700 dark:bg-blue-400/25 dark:text-blue-100' },
  'bapenda-profile': { Icon: Building2, className: 'bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-200' },
  'lapak-jambi-web': { Icon: Store, className: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200' },
  'lapak-jambi-app': { Icon: Smartphone, className: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200' },
}

export function AppMark({ code, size = 'md' }: { code: string; size?: 'sm' | 'md' }) {
  const m = MARKS[code] ?? { Icon: LayoutGrid, className: 'bg-muted text-muted-foreground' }
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md',
        size === 'sm' ? 'size-6 [&_svg]:size-3.5' : 'size-8 [&_svg]:size-4',
        m.className,
      )}
    >
      <m.Icon />
    </span>
  )
}
