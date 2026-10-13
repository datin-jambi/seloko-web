import { create } from 'zustand'
import { DEFAULT_APP_CODE, type AppCode } from '@/config/constants'

interface AppState {
  activeAppCode: AppCode | string
  setActiveAppCode: (code: AppCode | string) => void
}

const STORAGE_KEY = 'seloko_active_app'

export const useAppStore = create<AppState>((set) => ({
  activeAppCode:
    (localStorage.getItem(STORAGE_KEY) as AppCode) || DEFAULT_APP_CODE,
  setActiveAppCode: (code) => {
    localStorage.setItem(STORAGE_KEY, code)
    set({ activeAppCode: code })
  },
}))
