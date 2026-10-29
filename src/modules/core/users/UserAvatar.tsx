import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

/**
 * Avatar pengguna dengan fallback inisial.
 *
 * `GET /users` & `GET /users/:id` mengirim `avatarUrl` (ImageKit) yang bisa
 * kosong atau mati (berkas dihapus/CDN pindah). `AvatarImage` Radix otomatis
 * menampilkan `AvatarFallback` saat berkas gagal dimuat, jadi tidak perlu
 * `<img>` mentah + state onError sendiri.
 *
 * Satu komponen untuk daftar, detail, dan header — jangan menulis inisial
 * manual di tiap halaman (hasilnya berbeda-beda).
 */
const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-lg',
} as const

export function UserAvatar({
  name,
  src,
  size = 'sm',
  className,
}: {
  name?: string | null
  src?: string | null
  size?: keyof typeof SIZES
  className?: string
}) {
  const url = src?.trim() || null
  return (
    <Avatar className={cn(SIZES[size], 'ring-1 ring-border', className)}>
      {url && <AvatarImage key={url} src={url} alt="" />}
      <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials(name)}</AvatarFallback>
    </Avatar>
  )
}

/** "Budi Santoso" → "BS", "Budi" → "BU", kosong → "?". */
function initials(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
