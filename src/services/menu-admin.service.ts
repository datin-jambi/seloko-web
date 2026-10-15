import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'
import type { CreateMenuBody, MenuCmsNode, MenuListItemFull, ReorderMenusBody, UpdateMenuBody } from '@/types/core'

// Endpoint: ../seloko-api/src/modules/core/menus/menus.routes.ts
export const menuAdminService = {
  // Pohon penuh satu aplikasi, sudah termasuk `permission` & `roles` pembatas.
  tree: async (applicationId: string) =>
    (
      await apiClient.get<ApiResponse<MenuCmsNode[]>>('/menus', {
        params: { applicationId, tree: 'true' },
      })
    ).data.data,

  // Daftar datar (flat) untuk halaman inventaris lintas aplikasi.
  list: async (applicationId: string) =>
    (
      await apiClient.get<ApiResponse<MenuListItemFull[]>>('/menus', {
        params: { applicationId, limit: 200 },
      })
    ).data.data,

  get: async (id: string) => (await apiClient.get<ApiResponse<MenuListItemFull>>(`/menus/${id}`)).data.data,

  create: async (body: CreateMenuBody) => (await apiClient.post<ApiResponse<MenuListItemFull>>('/menus', body)).data.data,

  update: (id: string, body: UpdateMenuBody) => apiClient.patch(`/menus/${id}`, body),

  setActive: (id: string, isActive: boolean) => apiClient.patch(`/menus/${id}/activate`, { isActive }),

  // Urutan/induk banyak item sekaligus — satu request, satu transaksi di server.
  reorder: (body: ReorderMenusBody) => apiClient.patch('/menus/reorder', body),

  remove: (id: string) => apiClient.delete(`/menus/${id}`),
}
