import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'
import type {
  CreatePermissionBody,
  PermissionDetail,
  PermissionListItem,
  UpdatePermissionBody,
} from '@/types/core'

// Endpoint: ../seloko-api/src/modules/core/permissions/permissions.routes.ts
export const permissionService = {
  // Limit 200 = maksimum API (permission per aplikasi bisa ratusan).
  listByApp: async (applicationId: string) =>
    (
      await apiClient.get<ApiResponse<PermissionListItem[]>>('/permissions', {
        params: { applicationId, limit: 200 },
      })
    ).data.data,

  get: async (id: string) => (await apiClient.get<ApiResponse<PermissionDetail>>(`/permissions/${id}`)).data.data,

  create: async (body: CreatePermissionBody) =>
    (await apiClient.post<ApiResponse<PermissionListItem>>('/permissions', body)).data.data,

  // `code` dan `applicationId` sengaja tidak bisa diubah API.
  update: (id: string, body: UpdatePermissionBody) => apiClient.patch(`/permissions/${id}`, body),

  remove: (id: string) => apiClient.delete(`/permissions/${id}`),
}
