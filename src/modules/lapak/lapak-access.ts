import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { APP_CODES } from '@/config/constants'
import type { ApiResponse } from '@/types'

/** Hasil `GET /permissions/:applicationId/me`. */
type MyPermissions = {
  roles: { id: string; name: string; expiresAt: string | null }[]
  permissions: string[]
}

/**
 * Role yang boleh mengelola OPD di Lapak.
 *
 * Kenapa ROLE, bukan permission: modul OPD memakai permission `organization:*`
 * milik aplikasi **Lapak** (bukan Seloko), dan role `admin`/`superadmin` sudah
 * otomatis memegang seluruh permission aplikasinya (`allowedActions: null` di
 * seeder). Role lain seperti `editor`/`verifikator` sengaja TIDAK memegang
 * entitas `organization`, jadi cukup memeriksa role di sini — tanpa perlu
 * menebak isi permission satu per satu.
 */
const KELOLA_ROLES = ['admin', 'superadmin'] as const

type MyApp = { id: string; code: string }

/**
 * Kode aplikasi Lapak CMS milik pemanggil + perannya di sana.
 *
 * Halaman ini tidak boleh memakai `activeAppCode` dari store: nilai itu
 * mengikuti workspace yang sedang dibuka. Yang dicari justru aplikasi tempat
 * halaman ini bernaung (`lapak-jambi-web`).
 */
export function useMyPermissions() {
  const app = useQuery({
    queryKey: ['applications', 'me', 'lapak-cms'] as const,
    staleTime: 10 * 60_000,
    queryFn: async () => (await apiClient.get<ApiResponse<MyApp[]>>('/applications/me')).data.data,
  })

  const appId = app.data?.find((a) => a.code === APP_CODES.LAPAK_JAMBI_CMS)?.id

  const perms = useQuery({
    queryKey: ['permissions', 'me', appId ?? ''] as const,
    enabled: !!appId,
    staleTime: 5 * 60_000,
    queryFn: async () =>
      (await apiClient.get<ApiResponse<MyPermissions>>(`/permissions/${appId}/me`)).data.data,
  })

  const roles = perms.data?.roles.map((r) => r.name) ?? []
  return {
    roles,
    /** Boleh menambah/mengubah/menghapus OPD di Lapak. */
    canManage: roles.some((r) => (KELOLA_ROLES as readonly string[]).includes(r)),
    isLoading: app.isPending || perms.isPending,
  }
}
