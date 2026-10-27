import { apiClient } from '@/lib/api-client'
import type { ApiResponse, MenuItemTree } from '@/types'

export const menuService = {
  /**
   * Menu sidebar milik aplikasi `appCode` — sudah difilter backend berdasarkan
   * role & permission akun (menus.service.ts → `getMyMenus`).
   *
   * `appCode` WAJIB diberikan pemanggil, bukan dibaca dari store di dalam sini:
   * nilainya sama dengan yang dipakai `queryKey` (`['menus', appCode]`). Kalau
   * fungsi membaca store sendiri, dua pemanggil dengan appCode berbeda bisa
   * saling menimpa cache.
   *
   * Konteks aplikasi dikirim sebagai QUERY PARAM, bukan header `X-App-Code` —
   * header harus tetap `seloko` (gateway) agar lolos authenticate backend.
   */
  async getMyMenus(appCode: string | null): Promise<MenuItemTree[]> {
    if (!appCode) return []
    const res = await apiClient.get<ApiResponse<{ menus: MenuItemTree[] }>>('/menus/me', {
      params: { appCode },
    })
    return res.data.data.menus
  },
}
