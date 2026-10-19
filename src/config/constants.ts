export const APP_CODES = {
  SELOKO: 'seloko',
  BAPENDA_PROFILE: 'bapenda-profile',
  LAPAK_JAMBI_WEB: 'lapak-jambi-web',
  LAPAK_JAMBI_APP: 'lapak-jambi-app',
} as const

export type AppCode = (typeof APP_CODES)[keyof typeof APP_CODES]

export const APP_CONFIGS: Record<
  string,
  { name: string; description: string; icon: string; home: string }
> = {
  [APP_CODES.SELOKO]: {
    name: 'Seloko',
    description: 'Pengguna, hak akses, aplikasi, dan menu',
    icon: 'shield',
    home: '/seloko/dashboard',
  },
  [APP_CODES.BAPENDA_PROFILE]: {
    name: 'Portal Bapenda',
    description: 'UPTD Samsat, banner, berita, dan halaman',
    icon: 'building-2',
    home: '/bapenda/dashboard',
  },
  [APP_CODES.LAPAK_JAMBI_WEB]: {
    name: 'Lapak Jambi',
    description: 'Verifikasi merchant UMKM dan katalog produk',
    icon: 'store',
    home: '/lapak/dashboard',
  },
}

// Path menu di DB berprefix aplikasi (/seloko, /bapenda, /lapak). Prefix → kode app.
const segment = (path: string) => path.split('/')[1]
export const appCodeFromPath = (pathname: string) =>
  Object.keys(APP_CONFIGS).find((code) => segment(APP_CONFIGS[code].home) === segment(pathname))

export const appHome = (code: string) => APP_CONFIGS[code]?.home ?? APP_CONFIGS[APP_CODES.SELOKO].home

// Default RELATIF ('/api') agar dev server memakai proxy Vite — lihat
// vite.config.ts. Memanggil API lintas origin membuat cookie refresh
// (SameSite=Strict, Path=/api/auth) tidak ikut terkirim sehingga
// /auth/refresh membalas 401 "No refresh token provided" saat frontend
// dibuka lewat host selain localhost. Build produksi tetap memakai URL
// absolut dari VITE_API_BASE_URL.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const DEFAULT_APP_CODE =
  import.meta.env.VITE_DEFAULT_APP_CODE || APP_CODES.SELOKO

export const APP_NAME =
  import.meta.env.VITE_APP_NAME || 'SELOKO WEB'

export const APP_INSTITUTION =
  import.meta.env.VITE_APP_INSTITUTION || 'BPKPD Provinsi Jambi'

export const IMAGEKIT_URL_ENDPOINT =
  import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/o7kpef481o'
