import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'
import type {
  CreateOrganizationBody,
  OrganizationDetail,
  OrganizationListItem,
  UpdateOrganizationBody,
} from '@/types/core'

// Endpoint: ../seloko-api/src/modules/core/organizations/organizations.routes.ts
export const organizationService = {
  /**
   * Daftar OPD untuk PILIHAN FORM (produk lapak, penugasan role, dsb).
   *
   * Memakai `/organizations/public`, BUKAN `/organizations`: yang kedua menuntut
   * `organization:list` milik seloko, sehingga admin OPD — yang justru paling
   * sering membuat produk — akan kena 403. Endpoint publik cukup `authenticate`.
   */
  activePublic: async () =>
    (await apiClient.get<ApiResponse<OrganizationListItem[]>>('/organizations/public')).data.data.filter(
      (o) => o.isActive,
    ),

  /**
   * Profil satu OPD berdasarkan KODE (bukan id) — `GET /organizations/public/:code`.
   * Tanpa permission, jadi aman dipakai aplikasi lain (mis. detail OPD di Lapak).
   */
  publicByCode: async (code: string) =>
    (await apiClient.get<ApiResponse<OrganizationListItem>>(`/organizations/public/${encodeURIComponent(code)}`)).data
      .data,

  // ── CMS (master OPD) ───────────────────────────────────────────────────────
  list: async (params?: Record<string, string>) =>
    (await apiClient.get<ApiResponse<OrganizationListItem[]>>('/organizations', { params })).data,

  get: async (id: string) =>
    (await apiClient.get<ApiResponse<OrganizationDetail>>(`/organizations/${id}`)).data.data,

  create: async (body: CreateOrganizationBody) =>
    (await apiClient.post<ApiResponse<OrganizationListItem>>('/organizations', body)).data.data,

  update: async (id: string, body: UpdateOrganizationBody) =>
    (await apiClient.put<ApiResponse<OrganizationListItem>>(`/organizations/${id}`, body)).data.data,

  /** Menonaktifkan menurun ke SELURUH sub-unit; mengaktifkan kembali hanya baris ini. */
  setActive: async (id: string, isActive: boolean) =>
    (await apiClient.patch<ApiResponse<OrganizationListItem>>(`/organizations/${id}/active`, { isActive })).data
      .data,

  remove: (id: string) => apiClient.delete(`/organizations/${id}`),
}
