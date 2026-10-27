import { useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { MenuIcon } from '@/components/shared/MenuIcon'
import { cn } from '@/lib/utils'

/** Field logo yang dipakai — sengaja sempit supaya bisa dipakai ulang lintas tipe. */
interface LogoSource {
  code: string
  name?: string
  icon?: string | null
  logoUrl?: string | null
  logoDarkUrl?: string | null
}

const SIZES = {
  sm: 'size-5',
  md: 'size-6',
  lg: 'size-9',
} as const

type Size = keyof typeof SIZES

/**
 * Penanda aplikasi dengan rantai fallback:
 *
 * 1. `logoDarkUrl` — saat tema gelap (logo putih di atas kartu gelap).
 * 2. `logoUrl` — logo utama.
 * 3. `icon` — nama ikon Lucide dari DB (mis. `building-2`, `store`).
 * 4. `LayoutGrid` netral — bila ketiganya kosong/tak dikenal.
 *
 * Urutan ini disengaja: gambar resmi selalu menang atas ikon generik, tetapi
 * ikon tetap dipakai kalau logonya belum diunggah. `code` hanya dipakai sebagai
 * teks alternatif, BUKAN untuk menebak ikon — tebakan per-kode membuat aplikasi
 * baru selalu tampil sebagai kotak kosong sampai kodenya ditambahkan ke sini.
 *
 * URL logo disimpan sebagai string di DB sehingga tautan mati (CDN pindah,
 * berkas dihapus) tidak ketahuan dari API. Karena itu kegagalan muat dicatat
 * per-src lalu DIESKALASI ke ikon — tanpa ini browser hanya menampilkan kotak
 * kosong/ikon gambar rusak.
 */
export function AppLogo({ app, size = 'md', className }: { app: LogoSource; size?: Size; className?: string }) {
  const box = cn(SIZES[size], 'shrink-0', className)
  const alt = app.name ?? app.code
  const [broken, setBroken] = useState<Record<string, boolean>>({})

  const light = app.logoUrl && !broken[app.logoUrl] ? app.logoUrl : null
  const dark = app.logoDarkUrl && !broken[app.logoDarkUrl] ? app.logoDarkUrl : null
  const markBroken = (src: string) => setBroken((b) => (b[src] ? b : { ...b, [src]: true }))

  if (light || dark) {
    // Kedua varian dirender sekaligus lalu dipilih CSS; menghindari pembacaan
    // `document.documentElement` saat render (tidak reaktif terhadap toggle tema).
    const bothExist = !!light && !!dark
    const img = (src: string, extra?: string) => (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => markBroken(src)}
        className={cn('size-full object-contain', extra)}
      />
    )
    return (
      <span className={cn(box, 'relative block')}>
        {light && img(light, bothExist ? 'dark:hidden' : undefined)}
        {dark && img(dark, bothExist ? 'hidden dark:block' : undefined)}
      </span>
    )
  }

  // Tidak ada logo yang bisa dirender → ikon dari DB, lalu kotak netral.
  return app.icon ? (
    <MenuIcon name={app.icon} className={cn(box, 'text-primary')} />
  ) : (
    <LayoutGrid className={cn(box, 'text-muted-foreground/70')} aria-label={alt} />
  )
}
