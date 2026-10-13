import { create } from 'zustand'
import { DEFAULT_APP_CODE, type AppCode } from '@/config/constants'

interface AppState {
  activeAppCode: AppCode | string
  setActiveAppCode: (code: AppCode | string) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

const STORAGE_KEY = 'seloko_active_app'
const SIDEBAR_KEY = 'seloko_sidebar_collapsed'

export const useAppStore = create<AppState>((set) => ({
  activeAppCode:
    (localStorage.getItem(STORAGE_KEY) as AppCode) || DEFAULT_APP_CODE,
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
}))
