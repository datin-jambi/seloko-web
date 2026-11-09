import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { APP_CODES } from '@/config/constants'
import { useAuthStore } from '@/stores/auth-store'
import type { ApiResponse } from '@/types'

/** Hasil `GET /permissions/:applicationId/me`. */
type MyPermissions = {
  roles: { id: string; name: string; expiresAt: string | null }[]
  permissions: string[]
}

/**
 * Gerbang izin modul Lapak.
 *
 * Kenapa ROLE untuk OPD, tapi PERMISSION untuk kategori:
 * - Modul OPD (`/lapak/opd`) memakai permission `organization:*` milik aplikasi
 *   **Lapak**, dan role `admin`/`superadmin` sudah otomatis memegang seluruh
 *   permission aplikasinya (`allowedActions: null` di seeder). Cukup cek role.
 * - Modul katalog (kategori, produk, pesanan, SKRD, tiket) memakai permission
 *   berjenjang yang TIDAK dimiliki semua admin — `admin-opd`/`manajer-opd`
 *   sengaja tidak memegang entity `category`, dan `product:approve` hanya
 *   dipegang verifikator/Bapenda. Jadi tombol harus mengikuti `permissions`
 *   yang benar-benar dikirim server, bukan tebakan dari nama role.
 *
 * Superadmin selalu lolos (`isSuperAdmin`), sama seperti `hasPermission` di
 * auth-store.
 */
export function useLapakAccess() {
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin)

  const app = useQuery({
    queryKey: ['applications', 'me', 'lapak-cms'] as const,
    staleTime: 10 * 60_000,
    queryFn: async () =>
      (await apiClient.get<ApiResponse<{ id: string; code: string }[]>>('/applications/me')).data.data,
  })

  const appId = app.data?.find((a) => a.code === APP_CODES.LAPAK_JAMBI_CMS)?.id

  const perms = useQuery({
    queryKey: ['permissions', 'me', appId ?? ''] as const,
    enabled: !!appId,
    staleTime: 5 * 60_000,
    queryFn: async () => (await apiClient.get<ApiResponse<MyPermissions>>(`/permissions/${appId}/me`)).data.data,
  })

  const roles = perms.data?.roles.map((r) => r.name) ?? []
  const granted = new Set(perms.data?.permissions ?? [])
  const can = (code: string) => !!isSuperAdmin || granted.has(code)

  return {
    roles,
    permissions: granted,
    isSuperAdmin: !!isSuperAdmin,
    /** Tambah/ubah/hapus OPD di Lapak (gerbang lama, tetap dipakai halaman OPD). */
    canManage: !!isSuperAdmin || roles.includes('admin') || roles.includes('superadmin'),
    /** Kategori hanya dikelola Bapenda — entity `category` tidak dipegang admin OPD. */
    canManageCategories: can('category:create') || can('category:update') || can('category:delete'),
    canCreateProduct: can('product:create'),
    canUpdateProduct: can('product:update'),
    canApproveProduct: can('product:approve'),
    /** Menolak produk (`product:reject`) — dipakai antrean Persetujuan Produk. */
    canRejectProduct: can('product:reject'),
    canPublishProduct: can('product:publish'),
    canDeleteProduct: can('product:delete'),
    canListOrders: can('order:list') || can('order:read'),
    canVerifyPayment: can('payment:approve'),
    canListPayments: can('payment:read'),
    canUseTicket: can('ticket:approve'),
    canManageSkrd: can('order:update'),
    canExportReport: can('report:export'),
    canReadReport: can('report:read'),
    canReadTickets: can('ticket:read'),
    isLoading: app.isPending || perms.isPending,
  }
}

/**
 * Alias lama untuk halaman OPD (`LapakOpdPage`, `LapakOpdDetailPage`).
 * Perilakunya kini identik dengan `useLapakAccess` — dipertahankan supaya
 * pemanggil lama tidak perlu diubah.
 */
export function useMyPermissions() {
  const { roles, canManage, isLoading } = useLapakAccess()
  return { roles, canManage, isLoading }
}
