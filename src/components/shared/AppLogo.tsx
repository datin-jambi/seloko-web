import { useEffect, useState } from 'react'
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

/** Mask butuh alpha, jadi hanya berkas PNG/SVG yang aman. JPEG tidak. */
const canMask = (src: string) => /\.(png|svg)(\?|#|$)/i.test(src)

/**
 * Penanda aplikasi. Rantai fallback dievaluasi **PER TEMA**, karena kedua slot
 * (terang & gelap) bisa punya status muat yang berbeda:
 *
 * | yang tersedia            | tema terang         | tema gelap          |
 * |--------------------------|---------------------|---------------------|
 * | `logoUrl` + `logoDarkUrl`| `logoUrl`           | `logoDarkUrl`       |
 * | `logoUrl` saja           | `logoUrl`           | mask putih `logoUrl`|
 * | `logoDarkUrl` saja       | ikon DB             | `logoDarkUrl`       |
 * | tidak ada / mati semua   | ikon DB → netral    | ikon DB → netral    |
 *
 * Kenapa per tema dan bukan satu rantai global: kasus nyata di DB adalah
 * `logoUrl` menunjuk CDN yang sudah mati sementara `logoDarkUrl` (ImageKit)
 * masih hidup. Dengan rantai global, tema terang ikut merender logo mati dan
 * menyisakan kotak kosong — padahal ikon DB tersedia. Slot terang kini jatuh ke
 * ikon, slot gelap tetap memakai logo asli.
 *
 * Kenapa `logoUrl` di-mask pada tema gelap, bukan `filter: invert()`: logo bisa
 * berwarna (bukan hitam pekat), sehingga invert menghasilkan warna komplementer
 * yang salah, bukan putih. Mask memakai alpha berkas → bentuk tetap, warna
 * `currentColor`. Syaratnya PNG transparan/SVG; JPEG (latar putih solid) akan
 * tampil sebagai kotak penuh, jadi berkas non-PNG/SVG dirender sebagai gambar
 * biasa dan biarkan pemanggil mengatur latarnya.
 *
 * Deteksi URL mati: `logoUrl` hanya string di DB, jadi CDN pindah/berkas
 * dihapus tidak terlihat dari API. Kegagalan muat dicatat per-`src` lalu
 * dieskalasi — tanpa ini browser hanya menampilkan ikon gambar rusak. Mask
 * tidak memicu `onError` (bukan elemen gambar), jadi keberadaan berkas diuji
 * lewat `Image()`.
 *
 * `variant="original"` memaksa berkas apa adanya tanpa mask — dipakai halaman
 * detail (Aset Visual) yang justru memeriksa berkas aslinya.
 */
export function AppLogo({
  app,
  size = 'md',
  className,
  variant = 'theme',
}: {
  app: LogoSource
  size?: Size
  className?: string
  variant?: 'theme' | 'original'
}) {
  const box = cn(SIZES[size], 'shrink-0', className)
  const alt = app.name ?? app.code
  const [broken, setBroken] = useState<Record<string, boolean>>({})

  const markBroken = (src: string) => setBroken((b) => (b[src] ? b : { ...b, [src]: true }))

  const light = app.logoUrl && !broken[app.logoUrl] ? app.logoUrl : null
  const dark = app.logoDarkUrl && !broken[app.logoDarkUrl] ? app.logoDarkUrl : null

  // Hanya dipakai saat tema gelap harus memakai berkas terang (mask putih).
  const maskSrc =
    variant === 'theme' && !dark && light && canMask(light) ? light : null

  useEffect(() => {
    if (!maskSrc) return
    let alive = true
    const probe = new Image()
    probe.onerror = () => {
      if (alive) markBroken(maskSrc)
    }
    probe.src = maskSrc
    return () => {
      alive = false
      probe.onerror = null
    }
  }, [maskSrc])

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

  const icon = (extra?: string) =>
    app.icon ? (
      <MenuIcon name={app.icon} className={cn('size-full', extra)} />
    ) : (
      <LayoutGrid className={cn('size-full text-muted-foreground/70', extra)} aria-label={alt} />
    )

  // Tidak ada berkas yang bisa dipakai di tema mana pun → ikon tunggal; warnanya
  // mengikuti `currentColor` sehingga otomatis benar di kedua tema.
  if (!light && !dark) return <span className={cn(box, 'block')}>{icon()}</span>

  // Hanya logo gelap yang tersedia: slot terang memakai ikon, slot gelap logo.
  if (!light) {
    return (
      <span className={cn(box, 'relative block')}>
        <span className="block size-full dark:hidden">{icon()}</span>
        <span className="hidden size-full dark:block">{img(dark!)}</span>
      </span>
    )
  }

  // Hanya logo terang: slot gelap memakai mask bila memungkinkan.
  if (!dark) {
    return (
      <span className={cn(box, 'relative block')}>
        <span className="block size-full dark:hidden">{img(light)}</span>
        <span className="hidden size-full dark:block">
          {maskSrc ? (
            <span
              role="img"
              aria-label={alt}
              className="block size-full bg-current"
              style={{
                WebkitMaskImage: `url("${maskSrc}")`,
                maskImage: `url("${maskSrc}")`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}
            />
          ) : (
            img(light)
          )}
        </span>
      </span>
    )
  }

  // Kedua varian ada → dirender berdampingan, CSS yang memilih. Warna mengikuti
  // tema tanpa membaca `document.documentElement` saat render.
  return (
    <span className={cn(box, 'relative block')}>
      {img(light, 'dark:hidden')}
      {img(dark, 'hidden dark:block')}
    </span>
  )
}
