import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'
import type { UserDetail } from '@/types/core'

// Endpoint: ../seloko-api/src/modules/core/users/users.routes.ts
export const userService = {
  get: async (id: string) => (await apiClient.get<ApiResponse<UserDetail>>(`/users/${id}`)).data.data,
  setActive: (id: string, isActive: boolean) => apiClient.patch(`/users/${id}/activate`, { isActive }),
  remove: (id: string) => apiClient.delete(`/users/${id}`),
}
