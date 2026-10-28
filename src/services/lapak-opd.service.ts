import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'
import type { OrganizationListItem } from '@/types/core'

/**
 * CRUD OPD untuk CMS Lapak — `GET/POST/PUT/PATCH/DELETE /lapak/opd`.
 *
 * Bukan `organizationService` (endpoint core `/organizations`) karena endpoint
 * itu memeriksa izin pada aplikasi Seloko. Endpoint di sini memeriksa izin pada
 * aplikasi Lapak, sehingga role `admin`/`superadmin` Lapak berwenang.
 */
export const lapakOpdService = {
  /** Daftar untuk tabel; cukup `organization:read` sehingga editor bisa melihat. */
  list: async () =>
    (await apiClient.get<ApiResponse<OrganizationListItem[]>>('/lapak/opd/tampilan')).data.data,

  get: async (id: string) =>
    (await apiClient.get<ApiResponse<OrganizationListItem>>(`/lapak/opd/${id}`)).data.data,

  create: async (body: Record<string, unknown>) =>
    (await apiClient.post<ApiResponse<OrganizationListItem>>('/lapak/opd', body)).data.data,

  update: async (id: string, body: Record<string, unknown>) =>
    (await apiClient.put<ApiResponse<OrganizationListItem>>(`/lapak/opd/${id}`, body)).data.data,

  setActive: async (id: string, isActive: boolean) =>
    (await apiClient.patch<ApiResponse<OrganizationListItem>>(`/lapak/opd/${id}/active`, { isActive })).data.data,

  remove: (id: string) => apiClient.delete(`/lapak/opd/${id}`),
}
