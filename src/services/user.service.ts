import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'
import type { ApplicationListItem, AssignRoleBody, CreateUserBody, RoleListItem, UpdateUserBody, UserDetail } from '@/types/core'

// Endpoint: ../seloko-api/src/modules/core/users/users.routes.ts
export const userService = {
  get: async (id: string) => (await apiClient.get<ApiResponse<UserDetail>>(`/users/${id}`)).data.data,
  create: async (body: CreateUserBody) => (await apiClient.post<ApiResponse<UserDetail>>('/users', body)).data.data,
  update: async (id: string, body: UpdateUserBody) =>
    (await apiClient.patch<ApiResponse<UserDetail>>(`/users/${id}`, body)).data.data,
  setActive: (id: string, isActive: boolean) => apiClient.patch(`/users/${id}/activate`, { isActive }),
  remove: (id: string) => apiClient.delete(`/users/${id}`),
  assignRole: (id: string, body: AssignRoleBody) => apiClient.post(`/users/${id}/roles`, body),
  revokeRole: (id: string, userAppRoleId: string) => apiClient.delete(`/users/${id}/roles/${userAppRoleId}`),

  // Pilihan untuk dialog penugasan role. Daftar pendek → satu halaman besar cukup.
  // ponytail: limit 100; ganti ke pencarian bila aplikasi/role per aplikasi > 100.
  activeApps: async () =>
    (await apiClient.get<ApiResponse<ApplicationListItem[]>>('/applications', { params: { isActive: 'true', limit: 100 } })).data
      .data,
  activeRoles: async (applicationId: string, audience: string) =>
    (
      await apiClient.get<ApiResponse<RoleListItem[]>>('/roles', {
        params: { applicationId, audience, isActive: 'true', limit: 100 },
      })
    ).data.data,
}
