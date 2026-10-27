import { icons } from 'lucide-react'
import { LUCIDE_ICON_NAMES } from './lucide-names'

/**
 * Katalog ikon Lucide: nama kebab-case RESMI → komponen.
 *
 * Nama diambil dari `LUCIDE_ICON_NAMES` (daftar statis hasil generate), BUKAN
 * diturunkan dari kunci `icons` (PascalCase) — konversinya tidak bisa dibalik
 * dengan andal: `AArrowDown` → `a-arrow-down` (bukan `aarrow-down`),
 * `ArrowDown01` → `arrow-down-01`, `Axis3d` → `axis-3d`. Menebak dengan regex
 * membuat ~100 nama salah sehingga nilainya ditolak saat disimpan ke DB.
 *
 * Dimuat HANYA oleh `IconGrid` (lewat `lazy()` di `IconPicker`) supaya ~1.900
 * ikon tidak ikut bundle awal. Jangan impor dari komponen yang dirender saat
 * aplikasi mulai — ongkosnya ~160 kB gzip.
 */
export interface IconEntry {
  /** Nama kebab-case yang disimpan di DB, mis. `layout-dashboard`. */
  name: string
  Icon: React.ComponentType<{ className?: string }>
}

/** `arrow-down-01` → `ArrowDown01`. */
const toPascal = (name: string) =>
  name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')

const byPascal = icons as Record<string, IconEntry['Icon']>

// Semua nama di daftar ini sudah dipastikan punya komponen (lihat generator),
// tetapi tetap disaring agar upgrade paket tidak diam-diam merusak katalog.
export const ICON_ENTRIES: IconEntry[] = LUCIDE_ICON_NAMES.flatMap((name) => {
  const Icon = byPascal[toPascal(name)]
  return Icon ? [{ name, Icon }] : []
})
