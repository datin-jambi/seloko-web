import { apiClient } from '@/lib/api-client'
import type { ApiResponse, MenuItemTree, ApplicationItem } from '@/types'

export const menuService = {
  async getMyMenus(): Promise<MenuItemTree[]> {
    const res = await apiClient.get<ApiResponse<MenuItemTree[]>>('/menus/me')
    return res.data.data
  },

  async getApplications(): Promise<ApplicationItem[]> {
    const res = await apiClient.get<ApiResponse<ApplicationItem[]>>(
      '/applications',
    )
    return res.data.data
  },
}
