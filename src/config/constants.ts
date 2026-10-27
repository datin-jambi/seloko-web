// Kode aplikasi yang dipakai lintas kode. Selebihnya HARUS dari API:
// metadata aplikasi (nama, ikon, logo, baseUrl, tagline) datang dari
// `GET /applications/me` — lihat `use-apps.ts`. Konstanta hanya untuk yang
// memang perlu diketahui tanpa request (gateway header & prefix rute).
//
// NILAI HARUS SAMA PERSIS dengan kolom `code` di DB (prisma/seeds/core/
// applications.json). Salah ketik = aplikasi hilang dari App Switcher karena
// pencocokan `allowed.some(a => a.code === code)` tidak pernah cocok.
export const APP_CODES = {
  /** Gateway: header `X-App-Code` & login selalu memakai ini. */
  SELOKO: 'seloko',
  /**
   * CMS Bapenda. Namanya `bapenda-profile` walau isinya CMS — padanan PUBLIK-nya
   * `bapenda-portal`. JANGAN disamakan dengan kode publik: menu CMS menempel di
   * aplikasi INTERNAL, kalau tertukar sidebar jadi kosong.
   */
  BAPENDA_CMS: 'bapenda-profile',
  /** CMS Lapak Jambi. Padanan PUBLIK-nya `lapak-jambi-app`. */
  LAPAK_JAMBI_CMS: 'lapak-jambi-web',
} as const

export type AppCode = (typeof APP_CODES)[keyof typeof APP_CODES]

/**
 * Segmen URL tempat halaman sebuah workspace dirender (`src/App.tsx`).
 *
 * Dipisah dari `code` aplikasi karena keduanya memang beda: aplikasi
 * `lapak-jambi-web` dirender di bawah `/lapak/…`, `bapenda-profile` di bawah
 * `/bapenda/…`. Menyamakan keduanya membuat sidebar meminta `/menus/me?appCode=
 * lapak` — aplikasi itu tidak ada, server 404, sidebar kosong.
 */
export const WORKSPACES = ['seloko', 'bapenda', 'lapak'] as const
export type Workspace = (typeof WORKSPACES)[number]

/**
 * Aplikasi CMS mana yang mengisi sidebar tiap workspace. PEMETAAN INI YANG
 * MENENTUKAN aplikasi boleh muncul di App Switcher: hanya aplikasi yang punya
 * halaman di sini (`hasCmsRoute`) yang dipilih. Aplikasi INTERNAL yang belum
 * ada UI-nya tetap terdaftar di DB, tetapi tidak ditampilkan sebagai pilihan —
 * kalau dipilih, sidebar-nya kosong karena tidak ada halaman yang bisa dibuka.
 */
export const APP_WORKSPACE: Record<string, Workspace> = {
  [APP_CODES.SELOKO]: 'seloko',
  [APP_CODES.BAPENDA_CMS]: 'bapenda',
  [APP_CODES.LAPAK_JAMBI_CMS]: 'lapak',
}

/** Segmen URL → kode aplikasi. Kebalikan `APP_WORKSPACE`, dipakai membaca URL. */
const APP_OF_WORKSPACE: Record<Workspace, string> = {
  seloko: APP_CODES.SELOKO,
  bapenda: APP_CODES.BAPENDA_CMS,
  lapak: APP_CODES.LAPAK_JAMBI_CMS,
}

const segment = (path: string) => path.split('/')[1] ?? ''

/** Workspace milik sebuah aplikasi, atau `null` bila halamannya tidak ada di sini. */
export const appWorkspace = (code: string): Workspace | null => APP_WORKSPACE[code] ?? null

/** Apakah aplikasi ini punya halaman CMS di frontend ini. */
export const hasCmsRoute = (code: string) => code in APP_WORKSPACE

/** Beranda workspace, mis. `/bapenda/dashboard`. */
export const workspaceHome = (ws: Workspace) => `/${ws}/dashboard`

export const DEFAULT_WORKSPACE: Workspace = 'seloko'
export const DEFAULT_HOME = workspaceHome(DEFAULT_WORKSPACE)
export const DEFAULT_APP_CODE = import.meta.env.VITE_DEFAULT_APP_CODE || APP_CODES.SELOKO

/**
 * Beranda aplikasi. Aplikasi tanpa halaman di sini jatuh ke beranda bawaan —
 * tidak pernah ke URL kosong.
 */
export const appHome = (code: string) => {
  const ws = appWorkspace(code)
  return ws ? workspaceHome(ws) : DEFAULT_HOME
}

/** Kode aplikasi dari prefix URL (`/lapak/produk` → `lapak-jambi-web`). */
export const appCodeFromPath = (pathname: string) => {
  const ws = segment(pathname) as Workspace
  return WORKSPACES.includes(ws) ? APP_OF_WORKSPACE[ws] : null
}

/** Branding statis — dipakai sebelum `/applications/me` selesai dimuat. */
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'SELOKO'

export const APP_INSTITUTION = import.meta.env.VITE_APP_INSTITUTION || 'BPKPD Provinsi Jambi'

// Default RELATIF ('/api') agar dev server memakai proxy Vite — lihat
// vite.config.ts. Memanggil API lintas origin membuat cookie refresh
// (SameSite=Strict, Path=/api/auth) tidak ikut terkirim sehingga
// /auth/refresh membalas 401 "No refresh token provided" saat frontend
// dibuka lewat host selain localhost. Build produksi tetap memakai URL
// absolut dari VITE_API_BASE_URL.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const IMAGEKIT_URL_ENDPOINT =
  import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/o7kpef481o'
