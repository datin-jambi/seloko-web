export const APP_CODES = {
  SELOKO: 'seloko',
  BAPENDA_PROFILE: 'bapenda-profile',
  LAPAK_JAMBI_WEB: 'lapak-jambi-web',
  LAPAK_JAMBI_APP: 'lapak-jambi-app',
} as const

export type AppCode = (typeof APP_CODES)[keyof typeof APP_CODES]

export const APP_CONFIGS: Record<
  string,
  { name: string; description: string; icon: string; badgeColor: string }
> = {
  [APP_CODES.SELOKO]: {
    name: 'Seloko Core Gateway',
    description: 'Manajemen Pengguna, Hak Akses & Ekosistem Multi-Aplikasi',
    icon: 'shield',
    badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  },
  [APP_CODES.BAPENDA_PROFILE]: {
    name: 'CMS Portal Bapenda',
    description: 'Pengelolaan Kantor UPTD Samsat, Banner, Berita & Halaman',
    icon: 'building-2',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  [APP_CODES.LAPAK_JAMBI_WEB]: {
    name: 'Lapak Jambi Web',
    description: 'Verifikasi Merchant UMKM & Katalog Produk Daerah',
    icon: 'store',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const DEFAULT_APP_CODE =
  import.meta.env.VITE_DEFAULT_APP_CODE || APP_CODES.SELOKO

export const APP_NAME =
  import.meta.env.VITE_APP_NAME || 'SELOKO WEB'

export const APP_INSTITUTION =
  import.meta.env.VITE_APP_INSTITUTION || 'BPKPD Provinsi Jambi'

export const IMAGEKIT_URL_ENDPOINT =
  import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/o7kpef481o'
