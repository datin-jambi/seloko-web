import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'
import type {
  ApplicationListItem,
  AssignRoleBody,
  CreateUserBody,
  ListRoleAssignmentsQuery,
  RoleAssignmentSummary,
  RoleListItem,
  UpdateUserBody,
  UserDetail,
  UserRoleAssignment,
} from '@/types/core'

/**
 * Respons `GET /users/:id/roles`.
 *
 * Bentuknya BEDA dari `ApiResponse` biasa: `meta` wajib ada dan `summary`
 * berada di AKAR respons (di luar `data`) — ListRoleAssignmentsResponseSchema.
 */
interface RoleAssignmentsResponse extends ApiResponse<UserRoleAssignment[]> {
  summary: RoleAssignmentSummary
}

// Endpoint: ../seloko-api/src/modules/core/users/users.routes.ts
export const userService = {
  get: async (id: string) => (await apiClient.get<ApiResponse<UserDetail>>(`/users/${id}`)).data.data,
  create: async (body: CreateUserBody) => (await apiClient.post<ApiResponse<UserDetail>>('/users', body)).data.data,
  update: async (id: string, body: UpdateUserBody) =>
    (await apiClient.patch<ApiResponse<UserDetail>>(`/users/${id}`, body)).data.data,
  /**
   * PATCH /users/:id/activate — respons hanya `{ isActive }`, bukan profil
   * lengkap; jangan disangka UserDetail.
   */
  setActive: async (id: string, isActive: boolean) =>
    (await apiClient.patch<ApiResponse<{ isActive: boolean }>>(`/users/${id}/activate`, { isActive })).data.data,

  remove: async (id: string) => {
    await apiClient.delete(`/users/${id}`)
  },

  /**
   * GET /users/:id/roles — daftar penugasan role satu pengguna.
   *
   * Butuh permission `user-app-role:list`. `status` bawaan API = `active`
   * (yang kedaluwarsa disembunyikan); kirim `all` untuk audit.
   */
  listRoles: async (id: string, params: ListRoleAssignmentsQuery = {}) => {
    const res = await apiClient.get<RoleAssignmentsResponse>(`/users/${id}/roles`, { params })
    return { rows: res.data.data, meta: res.data.meta, summary: res.data.summary }
  },

  /**
   * POST /users/:id/roles — tugaskan role. Idempoten: pasangan
   * (user, aplikasi, role) yang sama hanya memperbarui `expiresAt`.
   * `organizationIds` mengganti lingkup OPD utuh, bukan menambah.
   */
  assignRole: async (id: string, body: AssignRoleBody) =>
    (await apiClient.post<ApiResponse<UserRoleAssignment>>(`/users/${id}/roles`, body)).data.data,

  revokeRole: async (id: string, userAppRoleId: string) => {
    await apiClient.delete(`/users/${id}/roles/${userAppRoleId}`)
  },

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
