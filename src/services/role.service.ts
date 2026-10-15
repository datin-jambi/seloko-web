import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'
import type { CreateRoleBody, RoleDetail, RoleListItem, UpdateRoleBody } from '@/types/core'

// Endpoint: ../seloko-api/src/modules/core/roles/roles.routes.ts
export const roleService = {
  // Limit 100 = maksimum API. Role per aplikasi jauh di bawah itu.
  listByApp: async (applicationId: string) =>
    (
      await apiClient.get<ApiResponse<RoleListItem[]>>('/roles', {
        params: { applicationId, limit: 100 },
      })
    ).data.data,

  // Detail memuat daftar centang: seluruh permission aplikasi + `granted`.
  get: async (id: string) => (await apiClient.get<ApiResponse<RoleDetail>>(`/roles/${id}`)).data.data,

  create: async (body: CreateRoleBody) => (await apiClient.post<ApiResponse<RoleListItem>>('/roles', body)).data.data,

  update: (id: string, body: UpdateRoleBody) => apiClient.patch(`/roles/${id}`, body),

  // Menyetel ulang SELURUH permission role (bukan menambah).
  setPermissions: (id: string, permissionIds: string[]) => apiClient.put(`/roles/${id}/permissions`, { permissionIds }),

  setActive: (id: string, isActive: boolean) => apiClient.patch(`/roles/${id}/activate`, { isActive }),

  remove: (id: string) => apiClient.delete(`/roles/${id}`),
}
