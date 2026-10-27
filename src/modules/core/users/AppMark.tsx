import { LayoutGrid } from 'lucide-react'
import { MenuIcon } from '@/components/shared/MenuIcon'
import { cn } from '@/lib/utils'

/**
 * Penanda aplikasi ringkas (ikon di dalam kotak berwarna) untuk daftar/tabel.
 *
 * Sumbernya `icon` dari DB (nama ikon Lucide), BUKAN peta per-kode seperti
 * sebelumnya: peta itu tidak mengenal aplikasi baru dan mencampur kode PUBLIK
 * dengan INTERNAL. Untuk tampilan yang butuh LOGO asli, pakai `AppLogo`.
 */
const TONE: Record<string, string> = {
  seloko: 'bg-primary/10 text-primary',
  'bapenda-profile': 'bg-muted text-foreground',
  'lapak-jambi-web': 'bg-muted text-foreground',
}

export function AppMark({
  code,
  icon,
  size = 'md',
}: {
  code: string
  icon?: string | null
  size?: 'sm' | 'md'
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md',
        size === 'sm' ? 'size-6 [&_svg]:size-3.5' : 'size-8 [&_svg]:size-4',
        TONE[code] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {icon ? <MenuIcon name={icon} className={size === 'sm' ? 'size-3.5' : 'size-4'} /> : <LayoutGrid />}
    </span>
  )
}
