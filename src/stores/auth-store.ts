import { create } from 'zustand'
import type { AuthUser } from '@/types'
import { useAppStore } from './app-store'
import { DEFAULT_APP_CODE } from '@/config/constants'

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  roles: string[]
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (token: string, user: AuthUser) => void
  setUserProfile: (profile: Partial<AuthUser> & { roles?: string[]; permissions?: string[] }) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
  hasPermission: (permissionCode: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  roles: [],
  permissions: [],
  isAuthenticated: false,
  isLoading: true,

  setAuth: (token, user) => {
    set({
      accessToken: token,
      user,
      roles: user.roles || [],
      permissions: user.permissions || [],
      isAuthenticated: true,
      isLoading: false,
    })
  },

  setUserProfile: (profile) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...profile } : null,
      roles: profile.roles ?? state.roles,
      permissions: profile.permissions ?? state.permissions,
    }))
  },

  setLoading: (loading) => set({ isLoading: loading }),

  clearAuth: () => {
    // Reset konteks aplikasi ke gateway saat sesi berakhir — konteks yang
    // tersisa (mis. bapenda-profile) bikin request berikutnya salah audience.
    useAppStore.getState().setActiveAppCode(DEFAULT_APP_CODE)
    set({
      accessToken: null,
      user: null,
      roles: [],
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    })
  },

  hasPermission: (permissionCode: string) => {
    const { user, permissions } = get()
    if (!user) return false
    if (user.isSuperAdmin) return true
    return permissions.includes(permissionCode)
  },
}))
