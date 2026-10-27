import { create } from 'zustand'
import { DEFAULT_APP_CODE } from '@/config/constants'

interface AppState {
  /** Environment aktif. `null` = belum ditentukan; Sidebar/switcher memilih. */
  activeAppCode: string | null
  setActiveAppCode: (code: string) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  /** Drawer navigasi di layar < md. Tidak disimpan. */
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

const STORAGE_KEY = 'seloko_active_app'
const SIDEBAR_KEY = 'seloko_sidebar_collapsed'

/**
 * Environment awal.
 *
 * Nilai tersimpan HANYA dipakai sebagai petunjuk awal — bukan kebenaran. Daftar
 * environment yang sah datang dari `GET /applications/me` (bergantung role &
 * permission akun). Karena satu browser bisa dipakai berganti akun, nilai lama
 * bisa menunjuk environment yang tidak boleh diakses akun sekarang; komponen
 * yang membaca daftar itulah yang wajib mengoreksinya (lihat `useActiveApp`).
 */
export const useAppStore = create<AppState>((set) => ({
  activeAppCode: localStorage.getItem(STORAGE_KEY) ?? DEFAULT_APP_CODE,
  setActiveAppCode: (code) => {
    localStorage.setItem(STORAGE_KEY, code)
    set({ activeAppCode: code })
  },
  sidebarCollapsed: localStorage.getItem(SIDEBAR_KEY) === '1',
  toggleSidebar: () =>
    set((s) => {
      localStorage.setItem(SIDEBAR_KEY, s.sidebarCollapsed ? '0' : '1')
      return { sidebarCollapsed: !s.sidebarCollapsed }
    }),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}))
