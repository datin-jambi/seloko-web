import { apiClient } from '@/lib/api-client'
import { useAppStore } from '@/stores/app-store'
import type { ApiResponse, MenuItemTree, ApplicationItem } from '@/types'

export const menuService = {
  async getMyMenus(): Promise<MenuItemTree[]> {
    // Konteks aplikasi aktif (UI) dikirim sebagai QUERY PARAM, bukan header
    // X-App-Code — header harus tetap "seloko" (gateway) agar lolos
    // authenticate backend.
    const activeApp = useAppStore.getState().activeAppCode
    const res = await apiClient.get<ApiResponse<{ menus: MenuItemTree[] }>>('/menus/me', {
      params: { appCode: activeApp },
    })
    return res.data.data.menus
  },

  async getApplications(): Promise<ApplicationItem[]> {
    const res = await apiClient.get<ApiResponse<ApplicationItem[]>>(
      '/applications',
    )
    return res.data.data
  },
}
