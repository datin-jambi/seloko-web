import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'
import type { ApplicationDetail, ApplicationListItem, CreateApplicationDTO, UpdateApplicationDTO } from '@/types/core'

// Endpoint: ../seloko-api/src/modules/core/applications/applications.routes.ts
export const applicationService = {
  get: async (id: string) =>
    (await apiClient.get<ApiResponse<ApplicationDetail>>(`/applications/${id}`)).data.data,

  // Isi dropdown filter (role/permission/menu). Limit 100 = maksimum API.
  listAll: async () =>
    (await apiClient.get<ApiResponse<ApplicationListItem[]>>('/applications', { params: { limit: 100 } })).data.data,

  // GET /permissions/modules?applicationId=… — modul distingtif + jumlah permission.
  // Dipakai filter Modul di halaman Permission. Endpoint menuntut applicationId.
  listModules: async (applicationId: string) =>
    (
      await apiClient.get<ApiResponse<{ module: string; permissionCount: number }[]>>('/permissions/modules', {
        params: { applicationId },
      })
    ).data.data,

  create: async (payload: CreateApplicationDTO) =>
    (await apiClient.post<ApiResponse<ApplicationDetail>>('/applications', payload)).data.data,

  update: async (id: string, payload: UpdateApplicationDTO) =>
    (await apiClient.patch<ApiResponse<ApplicationDetail>>(`/applications/${id}`, payload)).data.data,

  setActive: (id: string, isActive: boolean) =>
    apiClient.patch(`/applications/${id}/activate`, { isActive }),

  remove: (id: string) =>
    apiClient.delete(`/applications/${id}`),
}
