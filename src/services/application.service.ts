import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'
import type { ApplicationDetail, CreateApplicationDTO, UpdateApplicationDTO } from '@/types/core'

// Endpoint: ../seloko-api/src/modules/core/applications/applications.routes.ts
export const applicationService = {
  get: async (id: string) =>
    (await apiClient.get<ApiResponse<ApplicationDetail>>(`/applications/${id}`)).data.data,

  create: async (payload: CreateApplicationDTO) =>
    (await apiClient.post<ApiResponse<ApplicationDetail>>('/applications', payload)).data.data,

  update: async (id: string, payload: UpdateApplicationDTO) =>
    (await apiClient.patch<ApiResponse<ApplicationDetail>>(`/applications/${id}`, payload)).data.data,

  setActive: (id: string, isActive: boolean) =>
    apiClient.patch(`/applications/${id}/activate`, { isActive }),

  remove: (id: string) =>
    apiClient.delete(`/applications/${id}`),
}
